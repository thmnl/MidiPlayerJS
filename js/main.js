let mididata = [];
let addTimecode = function () {
    mididata = [];
    let t = 0;
    for (data of player.data) {
        t += data[1];
        let newdata = {
            time: t / 1000,
            msg: data[0].event,
            velocity: data[0].event.velocity / 10,
            track: data[0].track,
        };
        mididata.push(newdata);
    }
    for (data of mididata) {
        if (data.msg.subtype != "noteOn") continue;
        for (dt of mididata) {
            if (dt.time < data.time) continue;
            if (data.time + data.velocity < dt.time) break;
            if (dt.msg.subtype == "noteOff" && data.msg.noteNumber == dt.msg.noteNumber) {
                data.velocity = dt.time - data.time;
            }
        }
    }
}
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') {
        stroke = true;
    }
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        let defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (let side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }

}
let t1 = Date.now();
let previouscurrentTime = -1;
let colorNote_w = ["#42d4f5", "#e33030"];
let colorNote_b = ["#10b5b2", "#bf2828"];
let RefreshFrame = function () {
    let canvas = document.getElementById('animate');
    let height = (window.innerHeight > 0) ? window.innerHeight : screen.height;
    let botheight = document.getElementById('bot-div').offsetHeight;
    let gw = canvas.offsetWidth;
    let gh = height - botheight;
    canvas.style.height = gh + "px";
    canvas.width = gw;
    canvas.height = gh;
    let ctx = canvas.getContext('2d');
    currentTime = player.currentTime;
    if (!MIDI.Player.playing)
        currentTime = previouscurrentTime;
    if (previouscurrentTime == player.currentTime && MIDI.Player.playing) {
        currentTime = Date.now() - t1 + player.currentTime;
    }
    else {
        t1 = Date.now();
        previouscurrentTime = currentTime;
    }
    ctx.clearRect(0, 0, gw, gh);
    ctx.fillStyle = "#ddd";

    for (data of mididata) {
        if (data.msg.subtype == "noteOn") {
            let diff = (data.time - currentTime / 1000);
            if (diff <= data.velocity * -1 || diff > 3) {
                continue;
            }
            ctx.fillStyle = colorNote_w[data.track % 2];
            n = data.msg.noteNumber - 21;
            notediv = document.getElementById(n);
            modif = 0;
            x = notediv.getBoundingClientRect();
            if (notediv.className.endsWith("black"))
                ctx.fillStyle = colorNote_b[data.track % 2];
            else
                modif = x.width * 0.3;
            if (data.velocity <= 0.05) {
                data.velocity = 0.05;
            }
            h = data.velocity / 3 * gh;
            y = gh - (diff / 3 * gh);
            roundRect(ctx, x.x + modif / 2, y - h, x.width - modif, h, 5, true);
        }
    }
};

function SetVolume(value) {
    MIDI.setVolume(0, value);
    if (MIDI.Player.playing) {
        MIDI.Player.resume();
    }
}
function dragOverHandler(ev) {
    ev.preventDefault();
}
function dropHandler(ev) {
    ev.preventDefault();

    let file = ev.dataTransfer.files[0],
        reader = new FileReader();
    name = file.name.replace(".mid", " ");
    name = name.replace(/_/g, " ");
    reader.onload = function (event) {
        if (event.target.result.startsWith("data:audio/mid;base64")) {
            if (songid % songname.length != songname.length - 1) {
                place = (songid + 1) % songname.length;
            }
            else {
                place = songname.length;
            }
            songid = songid % songname.length;
            songname.splice(place, 0, name);
            song.splice(place, 0, event.target.result);
            player.getNextSong(+1);
        }
    };
    reader.readAsDataURL(file);
}
let pausePlayStop = function (stop) {
    let d = document.getElementById("pausePlayStop");
    if (stop) {
        MIDI.Player.stop();
        d.src = static_url + 'images/play.png';
    } else if (MIDI.Player.playing) {
        d.src = static_url + 'images/play.png';
        MIDI.Player.pause(true);
    } else {
        d.src = static_url + 'images/pause.png';
        MIDI.Player.resume();
    }
    d.blur();
}
document.addEventListener('keydown', function (event) {
    if (event.code == "Space") {
        pausePlayStop();
    }
});
let mousedown = false;
let setonmousedown = function (div) {
    div.onmouseover = function (e) {
        e.preventDefault();
        if (e.buttons == 0) {
            mousedown = false;
        }
        if (mousedown) {
            let pianoKey =  Number(e.target.id) + 21;

            div.style.boxShadow = "inset 0 0 10px black";
            div.style.background = colorNote_w[0];
            if (div.className.endsWith("black")) {
                div.style.background = colorNote_b[0];
                div.style.color = "#fff";
            }
            MIDI.noteOn(0, pianoKey, 127, 0);
        }
    }
    div.onmousedown = function (e) {
        e.preventDefault();
        mousedown = true;
        if (mousedown) {
            id = Number(e.target.id);
            let pianoKey = id + 21;
            div.style.boxShadow = "inset 0 0 10px black";
            div.style.background = colorNote_w[0];
            if (div.className.endsWith("black")) {
                div.style.background = colorNote_b[0];
                div.style.color = "#fff";
            }
            MIDI.noteOn(0, pianoKey, 127, 0);
        }
    }
}
let setonmouseup = function (div) {
    div.onmouseout = function (e) {
        let pianoKey = Number(e.target.id) + 21;

        e.preventDefault();
        div.style.boxShadow = "";
        div.style.background = "";
        div.style.color = "";
        MIDI.noteOff(0, pianoKey, 0, 0);
    }
    div.onmouseup = function (e) {
        let pianoKey = Number(e.target.id) + 21;

        e.preventDefault();
        mousedown = false;
        div.style.boxShadow = "";
        div.style.background = "";
        div.style.color = "";
        MIDI.noteOff(0, pianoKey, 0, 0);
    }
}
eventjs.add(window, "load", function (event) {
    let body = document.getElementById("animate");
    body.onmouseup = function (e) { e.preventDefault(); mousedown = false; };
    body.onmousedown = function (e) { e.preventDefault(); mousedown = true; };
    let colors = document.getElementById("piano");
    let colorElements = [];
    const piano_patern = [true, false, true, true, false, true, false, true, true, false, true, false];
    for (let n = 0; n < 88; n++) {
        let d = document.createElement("div");
        let d2 = document.createElement("div");

        d.className = "piano-key"
        d2.className = "piano-key_white"
        d2.id = n;
        setonmousedown(d2);
        setonmouseup(d2);
        colorElements.push(d2);
        d.appendChild(d2);
        if (piano_patern[(n + 1) % 12] == false && n + 1 < 88) {
            n++;
            let d3 = document.createElement("div");
            d3.className = "piano-key_black"
            setonmousedown(d3);
            setonmouseup(d3);
            d3.id = n;
            colorElements.push(d3);
            d.appendChild(d3);
        }
        colors.appendChild(d);
    }
    ///
    MIDI.loader = new sketch.ui.Timer;
    MIDI.loadPlugin({
        soundfontUrl: static_url + 'soundfont/',
        onprogress: function (state, progress) {
            MIDI.loader.setValue(progress * 100);
        },
        onsuccess: function () {
            let title = document.getElementById("title");
            title.innerHTML = "";
            player = MIDI.Player;
            MIDI.setVolume(0, 20);
            player.loadFile(song[songid % song.length]);
            let songnamediv = document.getElementById("songname");
            songnamediv.innerHTML = songname[songid % songname.length];
            addTimecode();
            setInterval(RefreshFrame, 1000 / 244);
            player.addListener(function (data) {
                let pianoKey = data.note - 21;
                let d = colorElements[pianoKey];
                if (d) {
                    if (data.message === 144) {
                        d.style.boxShadow = "inset 0 0 10px black";
                        d.style.background = colorNote_w[data.track % 2];
                        if (d.className.endsWith("black"))
                            d.style.background = colorNote_b[data.track % 2];
                        d.style.color = "#fff";
                    } else {
                        d.style.boxShadow = "";
                        d.style.background = "";
                        d.style.color = "";
                    }
                }
            });
            ///
            MIDIPlayerPercentage(player);
        }
    });
});
let MIDIPlayerPercentage = function (player) {
    let time1 = document.getElementById("time1");
    let time2 = document.getElementById("time2");
    let capsule = document.getElementById("capsule");
    let timeCursor = document.getElementById("cursor");
    //
    eventjs.add(capsule, "drag", function (event, self) {
        eventjs.cancel(event);
        player.currentTime = (self.x) / capsule.offsetWidth * player.endTime;
        if (player.currentTime < 0) player.currentTime = 0;
        if (player.currentTime > player.endTime) player.currentTime = player.endTime;
        if (self.state === "down") {
            player.pause(true);
        } else if (self.state === "up") {
            player.resume();
        }
    });
    //
    function timeFormatting(n) {
        let minutes = n / 60 >> 0;
        let seconds = String(n - (minutes * 60) >> 0);
        if (seconds.length == 1) seconds = "0" + seconds;
        return minutes + ":" + seconds;
    };
    player.getNextSong = function (n) {
        songid += n;
        let id = Math.abs((songid) % song.length);
        let songnamediv = document.getElementById("songname");
        previouscurrentTime = 1.5;
        player.loadFile(song[id]); // load MIDI
        songnamediv.innerHTML = songname[id % songname.length];
        addTimecode();
        player.start();
    };
    player.setAnimation(function (data, element) {
        let percent = data.now / data.end;
        let now = data.now >> 0; // where we are now
        let end = data.end >> 0; // end of song
        if (now === end) { // go to next song
            let id = ++songid % song.length;
            player.loadFile(song[id], player.start); // load MIDI
            let songnamediv = document.getElementById("songname");
            songnamediv.innerHTML = songname[songid % songname.length];
            addTimecode();
        }
        // display the information to the user
        timeCursor.style.width = (percent * 100) + "%";
        time1.innerHTML = timeFormatting(now);
        time2.innerHTML = "-" + timeFormatting(end - now);
    });
};

let player;

$(window).load(function () {
    "use strict";
    // makes sure the whole site is loaded
    $('#status').fadeOut('slow'); // will first fade out the loading animation
    $('#preloader').delay(350).fadeOut('slow'); // will fade out the white DIV that covers the website.
    $('body').delay(350).css({
        'overflow': 'visible'
    });
})
