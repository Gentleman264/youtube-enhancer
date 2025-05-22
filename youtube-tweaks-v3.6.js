// ==UserScript==
// @name         YouTube Super Tweaks - Cyberpunk Edition v3.6
// @version      3.6
// @description  Cloud Notes, Daily Timer with Smart Alert, Note Export, Notes Archive, Focus & Audio Mode, Firebase Sync
// @author       ستون
// @match        *://www.youtube.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const firebaseConfig = {
    apiKey: "AIzaSyDh2r0c6w5lN8QTuRV05vhG-8HiIvyXuPY",
    authDomain: "fir-a0e0e.firebaseapp.com",
    databaseURL: "https://fir-a0e0e-default-rtdb.firebaseio.com",
    projectId: "fir-a0e0e",
    storageBucket: "fir-a0e0e.firebasestorage.app",
    messagingSenderId: "46867713371",
    appId: "1:46867713371:web:8f0c3ee8e5bc1e80749e7e",
    measurementId: "G-4Q0DNSVMEX"
  };

  const firebaseScript = document.createElement("script");
  firebaseScript.src = "https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js";
  firebaseScript.onload = () => {
    const databaseScript = document.createElement("script");
    databaseScript.src = "https://www.gstatic.com/firebasejs/9.22.2/firebase-database-compat.js";
    databaseScript.onload = () => {
      firebase.initializeApp(firebaseConfig);
      const db = firebase.database();
      const videoId = new URLSearchParams(window.location.search).get("v") || "default";

      let notesVisible = false;

      function toggleNotesPanel() {
        let panel = document.getElementById("notesPanel");
        if (panel) {
          notesVisible = !notesVisible;
          panel.style.display = notesVisible ? "block" : "none";
          return;
        }

        panel = document.createElement("div");
        panel.id = "notesPanel";
        panel.style = "position:fixed;top:60px;right:20px;width:250px;height:300px;background:#1a002a;color:#ff4ffb;padding:10px;z-index:99999;box-shadow:0 0 15px #ff4ffb66;border-radius:10px;resize:both;overflow:auto;display:block;cursor:move;";

        panel.onmousedown = function (e) {
          e.preventDefault();
          let shiftX = e.clientX - panel.getBoundingClientRect().left;
          let shiftY = e.clientY - panel.getBoundingClientRect().top;
          function moveAt(pageX, pageY) {
            panel.style.left = pageX - shiftX + 'px';
            panel.style.top = pageY - shiftY + 'px';
            panel.style.right = 'auto';
          }
          function onMouseMove(e) {
            moveAt(e.pageX, e.pageY);
          }
          document.addEventListener('mousemove', onMouseMove);
          document.onmouseup = function () {
            document.removeEventListener('mousemove', onMouseMove);
            document.onmouseup = null;
          };
        };
        panel.ondragstart = () => false;

        const title = document.createElement("div");
        title.textContent = "📝 Notes";
        title.style = "font-weight:bold;margin-bottom:5px;text-align:left;";

        const textarea = document.createElement("textarea");
        textarea.placeholder = "Write your note here...";
        textarea.style = "width:100%;height:75%;background:#0d001a;color:#ff4ffb;border:none;outline:none;resize:none;font-family:monospace;direction:rtl;";

        const exportBtn = document.createElement("button");
        exportBtn.textContent = "📤 Export";
        exportBtn.style = "margin-top:8px;background:#33004d;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;font-family:monospace;";
        exportBtn.onclick = () => {
          const blob = new Blob([textarea.value], { type: "text/plain" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `note-${videoId}.txt`;
          link.click();
        };

        db.ref("notes/" + videoId).once("value").then(snapshot => {
          textarea.value = snapshot.val() || "";
        });
        textarea.addEventListener("input", () => {
          db.ref("notes/" + videoId).set(textarea.value);
        });

        panel.appendChild(title);
        panel.appendChild(textarea);
        panel.appendChild(exportBtn);
        document.body.appendChild(panel);
        notesVisible = true;
      }

      function showArchive() {
        db.ref("notes").once("value").then(snapshot => {
          const notes = snapshot.val();
          if (!notes) return alert("No notes found.");

          const container = document.createElement("div");
          container.style = "position:fixed;top:100px;left:50%;transform:translateX(-50%);width:400px;height:400px;background:#1a002a;color:#ff4ffb;padding:10px;z-index:99999;overflow:auto;border-radius:10px;font-family:monospace;box-shadow:0 0 15px #ff4ffb99;";

          const close = document.createElement("button");
          close.textContent = "❌ Close";
          close.style = "float:right;background:#33004d;color:#fff;border:none;padding:5px;border-radius:5px;cursor:pointer;margin-bottom:10px;";
          close.onclick = () => container.remove();

          container.appendChild(close);

          Object.entries(notes).forEach(([id, content]) => {
            const div = document.createElement("div");
            div.style.marginBottom = "10px";
            div.innerHTML = `<strong>${id}</strong><br><pre style='white-space:pre-wrap;'>${content}</pre>`;
            container.appendChild(div);
          });

          document.body.appendChild(container);
        });
      }

      const todayKey = new Date().toISOString().split('T')[0];
      let watchTime = parseInt(localStorage.getItem("yt_watch_minutes_" + todayKey)) || 0;
      setInterval(() => {
        watchTime++;
        localStorage.setItem("yt_watch_minutes_" + todayKey, watchTime);
        const box = document.getElementById("ytWatchBox");
        if (box) box.textContent = `⏱ ${watchTime} min / 90 min`;

        if (watchTime === 90) {
          alert("⚠️ You've reached your 90-minute YouTube limit for today!");
        }
      }, 60000);

      function showWatchProgress() {
        const box = document.createElement("div");
        box.id = "ytWatchBox";
        box.style = "position:fixed;top:40px;right:20px;background:#1a002a;color:#ff4ffb;padding:6px 12px;border:1px solid #ff4ffb;border-radius:6px;font-family:monospace;box-shadow:0 0 10px #ff4ffb44;z-index:99999;";
        box.textContent = `⏱ ${watchTime} min / 90 min`;
        document.body.appendChild(box);
      }

      function createToggleButton(label, onClick, verticalOffset) {
        const btn = document.createElement("button");
        btn.textContent = label;
        btn.style = `position:fixed;left:20px;bottom:${verticalOffset}px;z-index:99999;padding:8px 14px;background:#1a002a;color:#ff4ffb;border:1px solid #ff4ffb;border-radius:8px;font-family:monospace;box-shadow:0 0 12px #ff4ffb88;cursor:pointer;transition:all 0.3s ease;`;
        btn.onmouseenter = () => btn.style.background = "#33004d";
        btn.onmouseleave = () => btn.style.background = "#1a002a";
        btn.onclick = onClick;
        document.body.appendChild(btn);
      }

      let focusActive = false;
      function toggleFocusMode() {
        focusActive = !focusActive;
        const selectors = ['#comments', '#secondary', '#masthead', '#guide', 'ytd-merch-shelf-renderer'];
        selectors.forEach(sel => {
          const el = document.querySelector(sel);
          if (el) el.style.display = focusActive ? "none" : "";
        });
        const main = document.querySelector('ytd-watch-flexy');
        if (main) main.style.width = focusActive ? '100%' : '';
      }

      let audioOnly = false;
      function toggleAudioOnly() {
        const video = document.querySelector("video");
        if (!video) return;
        audioOnly = !audioOnly;
        video.style.display = audioOnly ? "none" : "block";
      }

      function initTweaks() {
        if (window.location.pathname !== "/watch") return;
        showWatchProgress();
        createToggleButton("🎯 Focus Mode", toggleFocusMode, 40);
        createToggleButton("🎧 Audio Only", toggleAudioOnly, 80);
        createToggleButton("📝 Notes", toggleNotesPanel, 120);
        createToggleButton("📚 Archive", showArchive, 160);
      }

      let lastPath = location.pathname;
      setInterval(() => {
        if (location.pathname !== lastPath) {
          lastPath = location.pathname;
          if (window.location.pathname === "/watch") {
            setTimeout(initTweaks, 500);
          }
        }
      }, 1000);

      if (window.location.pathname === "/watch") setTimeout(initTweaks, 800);
    };
    document.head.appendChild(databaseScript);
  };
  document.head.appendChild(firebaseScript);
})();
