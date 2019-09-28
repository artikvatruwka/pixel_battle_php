window.onload = function () {
let scale=8;
let colorPallette  = "#ff0000";
function connect() {
    let ws = new WebSocket('ws://localhost:8080');
    ws.onopen = () => {
        let startRequest = {
            type: "get",
            target: "start"
        };
        ws.send(JSON.stringify(startRequest));
    };

    ws.onmessage = (e) => {
        obj = JSON.parse(e.data);
        switch (obj.object) {
            case "start":
                start();
                break;
            case "pixel":
                drawPixel(obj.data);
                break;
            case "clear":
                destroyTable();
                renderTable(scale);
                fillTable(obj.data);
            default:
                console.error("Undefined server answer!");
                break;
        }
    };

    ws.onclose = (e) => {
        destroyTable();
        console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
        setTimeout(function() {
            connect();
        }, 1000);
        document.getElementById("loading").style.display="block";
    };

    ws.onerror = function(err) {
        console.error('Socket encountered error: ', err.message, 'Closing socket');
        ws.close();
    };

    function start(){

        renderTable(scale);
        fillTable(obj.data);
        document.getElementById("loading").style.display="none";
        let clearBtn = document.getElementById("clear-btn");
        clearBtn.addEventListener("click",()=>{
            clearTable();
        });
    }

    function destroyTable(){
        let table = document.getElementById("pixel-field");
        if(document.body.contains(table))
        table.parentElement.removeChild(table)
    }

    function createPixel(x,y,r,g,b) {
        return {
            x:x,
            y:y,
            r:r,
            g:g,
            b:b
        };
    }
    function sendPixel(ws, pixel) {
        let object ={
            type:"set",
            target:"pixel",
            data:pixel
        };
        ws.send(JSON.stringify(object));
    }
    function drawPixel(pixel){
        let cell = document.getElementById("pixel-x-"+pixel.x+"-y-"+pixel.y);
        cell.style.backgroundColor=rgbToHex(pixel.r,pixel.g,pixel.b);
        cell.style.cursor="default";
        cell.dataset.free="false";
        cell.dataset.color=cell.style.backgroundColor;
    }
    function clearTable(){
        if(confirm("Clear all table?")){
            let clear = {
                target: "clear",
                type: "set"
            };
            ws.send(JSON.stringify(clear));
        }

    }


    function componentToHex(c) {
        let hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }
    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function renderTable(scale) {
        let table = document.createElement("table");
        // table.style.minWidth=100*scale+"px";
        // table.style.minHeight=100*scale+"px";
        table.id="pixel-field";
        for(let i =0; i<100; i++){
            let row = document.createElement("tr");
            for(let j =0; j<100; j++){
                let cell = document.createElement("td");
                cell.style.width=scale+"px";
                cell.style.height=scale+"px";
                cell.style.background="#ffffff";
                cell.style.cursor="pointer";
                cell.dataset.free="true";
                cell.dataset.color="#ffffff";
                cell.id="pixel-x-"+j+"-y-"+i;
                cell.addEventListener("click",()=>{
                    if(cell.dataset.free=="true"){
                        rgb = hexToRgb(colorPallette);
                        componentToHex(colorPallette);
                        let pixel = createPixel(j,i,rgb.r,rgb.g,rgb.b);
                        sendPixel(ws,pixel);
                    }
                });
                cell.addEventListener("mouseenter", () =>{
                    if(cell.dataset.free=="true"){
                        cell.style.background=colorPallette;
                    }
                });
                cell.addEventListener("mouseleave", () =>{
                    cell.style.background=cell.dataset.color;
                });
                row.appendChild(cell);
            }
            table.appendChild(row);
        }
        document.getElementById("pixel-battle-app").appendChild(table);
    }
    function fillTable(pixels){

        for (let i = 0; i<pixels.length; i++){
            let pixel=pixels[i];
            drawPixel(pixel);
        }
    }

    function createColorPicker(){
        var source = document.getElementById("change-color"),
            picker = new CP(source);
        source.onclick = function(e) {
            e.preventDefault();
            source.backgroundColor="#"+e;
            colorPallette="#"+e;
        };
        picker.on("change", function(color) {
            this.source.style.backgroundColor= '#' + color;
            colorPallette="#"+color;
        });
    }

    createColorPicker();
}
    connect();
};