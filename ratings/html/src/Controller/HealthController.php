<?php

declare(strict_types=1);

namespace RobotShop\Ratings\Controller;

use RobotShop\Ratings\Service\HealthCheckService;
use Psr\Log\LoggerAwareInterface;
use Psr\Log\LoggerAwareTrait;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/** OpenTelemetry */
use OpenTelemetry\API\Trace\SpanKind;
use OpenTelemetry\API\Trace\StatusCode;
use OpenTelemetry\API\Trace\TracerProvider;
use OpenTelemetry\Context\Context;

/**
 * @Route("/_health")
 */
class HealthController implements LoggerAwareInterface
{
    use LoggerAwareTrait;

    /**
     * @var HealthCheckService
     */
    private $healthCheckService;

    /**
     * @var \OpenTelemetry\API\Trace\TracerInterface
     */
    private $tracer;

    public function __construct(HealthCheckService $healthCheckService)
    {
        $this->healthCheckService = $healthCheckService;

        // Initialize OpenTelemetry tracer
        $this->tracer = (new TracerProvider())
            ->getTracer('ratings-service');
    }

    public function __invoke(Request $request)
    {
        // Start a server span
        $span = $this->tracer
            ->spanBuilder('HealthController::__invoke')
            ->setSpanKind(SpanKind::KIND_SERVER)
            ->startSpan();

        $scope = $span->activate();

        $checks = [];
        try {
            $this->healthCheckService->checkConnectivity();
            $checks['pdo_connectivity'] = true;
            $span->setAttribute('pdo_connectivity', true);
        } catch (\PDOException $e) {
            $checks['pdo_connectivity'] = false;
            $span->setAttribute('pdo_connectivity', false);
            $span->recordException($e);
            $span->setStatus(StatusCode::STATUS_ERROR);
        }

        $this->logger->info('Health-Check', $checks);

        $span->setAttribute('http.method', $request->getMethod());
        $span->setAttribute('http.route', '/_health');

        $span->end();
        $scope->detach();

        return new JsonResponse(
            $checks,
            $checks['pdo_connectivity'] ? Response::HTTP_OK : Response::HTTP_BAD_REQUEST
        );
    }
}