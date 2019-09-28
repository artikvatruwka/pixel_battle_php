<?php
require 'vendor/autoload.php';
require "PixelHandler.php";

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use App\PixelHandler;
$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new PixelHandler()
        )
    ),
    8080    
);

$server->run();
