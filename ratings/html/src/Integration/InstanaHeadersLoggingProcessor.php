<?php

declare(strict_types=1);

namespace RobotShop\Ratings\Integration;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\FinishRequestEvent;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Contracts\Service\ResetInterface;
use OpenTelemetry\API\Trace\TracerProvider;
use OpenTelemetry\API\Trace\SpanKind;

class HeadersLoggingProcessor implements EventSubscriberInterface, ResetInterface
{
    private $routeData;
    private $tracer;
    private $activeSpans = [];

    public function __construct()
    {
        $this->routeData = [];
        $this->tracer = TracerProvider::getDefaultTracer();
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['addHeaderData', 1],
            KernelEvents::FINISH_REQUEST => ['removeHeaderData', 1],
        ];
    }

    public function __invoke(array $records): array
    {
        if ($this->routeData && !isset($records['extra']['requests'])) {
            $records['extra']['trace'] = array_values($this->routeData);
        }

        return $records;
    }

    public function addHeaderData(RequestEvent $event): void
    {
        if ($event->isMasterRequest()) {
            $this->reset();
        }

        $request = $event->getRequest();

        // ---- OpenTelemetry Instrumentation ----
        $span = $this->tracer
            ->spanBuilder('http.request.headers')
            ->setSpanKind(SpanKind::KIND_INTERNAL)
            ->startSpan();

        $span->setAttribute('http.method', $request->getMethod());
        $span->setAttribute('http.route', $request->getPathInfo());

        $requestId = spl_object_id($request);
        $this->activeSpans[$requestId] = $span;
        // ---------------------------------------

        $currentHeaders = [
            'user-agent' => $request->headers->get('User-Agent', 'n/a'),
            'content-type' => $request->headers->get('Content-Type', 'n/a'),
        ];

        $this->routeData[$requestId] = $currentHeaders;
    }

    public function reset(): void
    {
        $this->routeData = [];
        $this->activeSpans = [];
    }

    public function removeHeaderData(FinishRequestEvent $event): void
    {
        $request = $event->getRequest();
        $requestId = spl_object_id($request);

        // ---- End Span ----
        if (isset($this->activeSpans[$requestId])) {
            $this->activeSpans[$requestId]->end();
            unset($this->activeSpans[$requestId]);
        }
        // ------------------

        unset($this->routeData[$requestId]);
    }
}