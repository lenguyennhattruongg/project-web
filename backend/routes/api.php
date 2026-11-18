<?php

declare(strict_types=1);

use App\Core\Request;
use App\Core\Response;
use App\Core\Router;
use App\Features\Script\ScriptController;

/** @var Router $router */

$router->get('/api/health', function (Request $request): Response {
    return Response::json([
        'success' => true,
        'data' => [
            'status' => 'ok',
            'application' => 'Kich Ban Sat',
            'version' => '16',
        ],
    ]);
});

// ==========================================
// SCRIPT APIS — Phụ trách: TV2 (Backend Dev)
// ==========================================
$router->get('/api/scripts', [ScriptController::class, 'index']);
$router->get('/api/scripts/{id}', [ScriptController::class, 'show']);
