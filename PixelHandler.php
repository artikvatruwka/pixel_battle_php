<?php
namespace App;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
require_once "DB.php";
require_once "mysql_credentials.php";
class PixelHandler implements MessageComponentInterface {
    protected $clients;
    protected $db;
    public function __construct() {
        $this->db = new DB(MYSQL_HOST,MYSQL_USER,MYSQL_PASSWORD,MYSQL_DB);
        $this->db->query("CREATE DATABASE IF NOT EXISTS ".MYSQL_DB);
        $this->db->query("CREATE TABLE IF NOT EXISTS canvas (
             `x` tinyint(4) unsigned NOT NULL,
             `y` tinyint(4) unsigned NOT NULL,
             `r` tinyint(4) unsigned NOT NULL,
             `g` tinyint(4) unsigned NOT NULL,
             `b` tinyint(4) unsigned NOT NULL,
             PRIMARY KEY (`x`,`y`)
            ) ENGINE=MyISAM DEFAULT CHARSET=utf8");
        $this->clients = new \SplObjectStorage;

    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        echo "New connection! ({$conn->resourceId})\n";
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $msg = json_decode($msg);
        switch($msg->type){
            case "get":
                switch($msg->target){
                    case "start":
                        $this->sendToAll($this->getPixels());
                        break;
                    default:
                        $from->send("{\"error\":\"unexpected message\"}");
                        break;
                }
                break;
            case "set":
                switch ($msg->target){
                    case "pixel":
                        $this->sendToAll($this->addPixel($msg->data));
                        break;
                    case "clear":
                        $this->sendToAll($this->clearTable());
                        break;
                }
                break;
        }
    }

    public function onClose(ConnectionInterface $conn) {
        // The connection is closed, remove it, as we can no longer send it messages
        $this->clients->detach($conn);

        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";

        $conn->close();
    }
    private function sendToAll($msg){
        foreach ($this->clients as $client) {
            $client->send($msg);
        }
    }
    private function clearTable(){
        $this->db->query("DELETE FROM canvas WHERE 1");
        $obj = new \stdClass();
        $obj->object="clear";
        return json_encode($obj);
    }
    private function getPixels(){
        $pixels = $this->db->query("SELECT x,y,r,g,b FROM canvas")->fetchAll();
        $obj = new \stdClass();
        $obj->data = $pixels;
        $obj->object ="start";
        return json_encode($obj);
    }
    private function addPixel($pixel){
        $this->db->query("SELECT * FROM canvas WHERE x=".$pixel->x." and y=".$pixel->y);
        if($this->db->numRows()===0){
            $this->db->query("INSERT INTO canvas (x,y,r,g,b) values (".$pixel->x.",".$pixel->y.",".$pixel->r.",".$pixel->g.",".$pixel->b.")");
            $pix = new \stdClass();
            $pix->data = $pixel;
            $pix->object = "pixel";
            return json_encode($pix);
        }
    }

}