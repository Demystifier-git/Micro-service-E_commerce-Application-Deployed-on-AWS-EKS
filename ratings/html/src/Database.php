<?php

declare(strict_types=1);

namespace Instana\RobotShop\Ratings;

use PDO;
use PDOException;
use Psr\Log\LoggerAwareInterface;
use Psr\Log\LoggerAwareTrait;
use OpenTelemetry\API\Trace\TracerProvider;
use OpenTelemetry\API\Trace\SpanKind;

class Database implements LoggerAwareInterface
{
    use LoggerAwareTrait;

    /**
     * @var string
     */
    private $dsn;

    /**
     * @var string
     */
    private $user;

    /**
     * @var string
     */
    private $password;

    private $tracer;

    public function __construct(string $dsn, string $user, string $password)
    {
        $this->dsn = $dsn;
        $this->user = $user;
        $this->password = $password;

        // OpenTelemetry tracer
        $this->tracer = TracerProvider::getDefaultTracer();
    }

    public function getConnection(): PDO
    {
        $opt = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        // ---- Start DB Span ----
        $span = $this->tracer
            ->spanBuilder('database.connection')
            ->setSpanKind(SpanKind::KIND_CLIENT)
            ->startSpan();

        $span->setAttribute('db.system', 'mysql');
        $span->setAttribute('db.connection_string', $this->dsn);
        // -----------------------

        try {
            $pdo = new PDO($this->dsn, $this->user, $this->password, $opt);
            $span->end();
            return $pdo;
        } catch (PDOException $e) {
            $msg = $e->getMessage();
            $this->logger->error("Database error $msg");

            // Record exception in span
            $span->recordException($e);
            $span->setStatus(\OpenTelemetry\API\Trace\StatusCode::STATUS_ERROR);
            $span->end();

            return null;
        }
    }
}
