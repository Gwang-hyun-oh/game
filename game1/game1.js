// 📌 최상단에 외부 데이터 파일 연결구문을 주입합니다
import { objectGameData } from './data.js';

$(document).ready(function() {
  const feedbackAssets = {
    getCorrect: (color) => `<svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="32" stroke="${color}" stroke-width="15" stroke-linecap="round" fill="none"/>
              </svg>`,
    wrong: `<svg viewBox="0 0 100 100">
                <line x1="28" y1="28" x2="72" y2="72" stroke="#FF453A" stroke-width="16" stroke-linecap="round"/>
                <line x1="72" y1="28" x2="28" y2="72" stroke="#FF453A" stroke-width="16" stroke-linecap="round"/>
            </svg>`
  };

  const audioAssets = {
    startBtn: new Audio("./assets/audio/start_click.mp3"),   // 대문 플레이 버튼 효과음
    correct: new Audio("./assets/audio/correct_good.mp3"),    // "잘했어요!"
    wrong: new Audio("./assets/audio/wrong_retry.mp3"),        // "다시 한번 해봐요."
    ending: new Audio("./assets/audio/ending_applause.mp3")    // 환호성 팡파르
  };

  audioAssets.startBtn.preload = "auto";
  audioAssets.correct.preload = "auto";
  audioAssets.wrong.preload = "auto";
  audioAssets.ending.preload = "auto";

  let isAnimating = true; // 대문 화면 상태이므로 터치 막음 시작
  let currentAnimations = []; 
  let currentQuestionAudio = null;
  let endingLottieInstance = null;

  const TOTAL_QUESTIONS_PER_ROUND = objectGameData.length; 
  let solvedCount = 0;
  let availableQuestions = []; 

  $("#correct-svg-box").html(feedbackAssets.getCorrect("#307FF0"));
  $("#wrong-svg-box").html(feedbackAssets.wrong);

  // 시작 화면 대문 버튼 통통 뛰는 루프 모션
  gsap.fromTo("#start-play-btn", 
    { scale: 0.93 }, 
    { scale: 1.05, duration: 0.8, yoyo: true, repeat: -1, ease: "power1.inOut" }
  );

  // 🎮 인트로 플레이 버튼 클릭 트리거
  $("#start-play-btn").on("click", function() {
    playAudioFile(audioAssets.startBtn); // 시작 버튼 효과음 즉시 재생
    $(this).attr("disabled", true);

    // 📌 시작 화면이 완전히 사라지면 대기 시간 없이 곧바로 게임 세션과 첫 음성이 시작됩니다.
    gsap.to("#start-screen", { 
      opacity: 0, 
      scale: 1.05,
      duration: 0.4, // 유아가 지루해하지 않게 페이드 시간을 살짝 단축
      ease: "power2.inOut",
      delay:1.5,
      onComplete: function() {
        $("#start-screen").css("display", "none");
        
        solvedCount = 0;
        availableQuestions = [...objectGameData]; 
        shuffleArray(availableQuestions); 
        
        // 지연 시간(delayedCall)을 제거하고 화면이 걷히자마자 즉시 가동!
        loadNextRandomQuestion(); 
      }
    });
  });

  // 엔딩 리플레이 버튼 트리거
  $("#restart-btn").on("click", function() {
    gsap.to("#game-over-screen", { opacity: 0, duration: 0.4, onComplete: function() {
      $("#game-over-screen").css("display", "none");
      if (endingLottieInstance) endingLottieInstance.destroy();
      
      solvedCount = 0;
      availableQuestions = [...objectGameData]; 
      shuffleArray(availableQuestions); 
      loadNextRandomQuestion(); 
    }});
  });

  function playAudioFile(audioObj) {
    if (!audioObj) return;
    audioObj.pause();
    audioObj.currentTime = 0;
    audioObj.play().catch(e => console.warn("오디오 플레이 준비:", e));
  }

  function loadNextRandomQuestion() {
    isAnimating = false; // 클릭 차단 해제
    
    currentAnimations.forEach(anim => anim.destroy());
    currentAnimations = [];

    if (currentQuestionAudio) {
      currentQuestionAudio.pause();
      currentQuestionAudio = null;
    }

    const currentData = availableQuestions.pop();

    // 상단 텍스트 변경
    $("#target-word").text(currentData.word);
    gsap.fromTo("#target-word", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.5)" });

    // 📌 사물 텍스트가 팝업되면서 질문 오디오 바로 재생 -> "[사물이름] 어디에 있을까?"
    currentQuestionAudio = new Audio(currentData.questionAudio);
    currentQuestionAudio.preload = "auto";
    playAudioFile(currentQuestionAudio);

    // 오답 배열 셔플 주입
    const wrongCandidates = objectGameData.filter(item => item.id !== currentData.id);
    shuffleArray(wrongCandidates); 
    
    const wrongChoice1 = wrongCandidates[0];
    const wrongChoice2 = wrongCandidates[1];

    const choices = [currentData, wrongChoice1, wrongChoice2];
    shuffleArray(choices); 

    const $choicesArea = $("#choices-area");
    $choicesArea.empty();

    choices.forEach((item, idx) => {
      const isCorrect = (item.id === currentData.id);
      const lottieContainerId = `lottie-choice-${idx}`;
      
      const cardHtml = `
        <div class="choice-card" data-correct="${isCorrect}">
          <div id="${lottieContainerId}" class="lottie-box"></div>
        </div>
      `;
      $choicesArea.append(cardHtml);

      const animInstance = lottie.loadAnimation({
        container: document.getElementById(lottieContainerId),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: item.lottie,
        error: function() {
          lottie.loadAnimation({ container: document.getElementById(lottieContainerId), renderer: 'svg', loop: true, autoplay: true, path: item.fallback });
        }
      });
      currentAnimations.push(animInstance);
    });

    gsap.fromTo(".choice-card", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.1 });

    $(".choice-card").off("click").on("click", function() {
      if (isAnimating) return; 
      handleChoice($(this));
    });
  }

  function handleChoice($selectedCard) {
    isAnimating = true; 
    const isCorrect = $selectedCard.data("correct") === true;

    if (currentQuestionAudio) {
      currentQuestionAudio.pause();
    }

    if (isCorrect) {
      playAudioFile(audioAssets.correct);

      gsap.to($selectedCard, { scale: 1.05, duration: 0.15, yoyo: true, repeat: 1, ease: "power1.inOut" });
      $selectedCard.css("border-color", "#307FF0");

      $("#correct-svg-box").css("display", "block");
      gsap.fromTo("#correct-svg-box", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.8)" });

      solvedCount++; 

      gsap.delayedCall(1.6, function() {
        gsap.to("#correct-svg-box", { scale: 0, opacity: 0, duration: 0.25, ease: "power2.in", onComplete: function() {
          $("#correct-svg-box").css("display", "none");
          
          if (solvedCount >= TOTAL_QUESTIONS_PER_ROUND) {
            showGameOverScreen();
          } else {
            loadNextRandomQuestion(); 
          }
        }});
      });

    } else {
      playAudioFile(audioAssets.wrong); 

      gsap.fromTo($selectedCard, { x: -8 }, { x: 8, duration: 0.08, repeat: 4, yoyo: true, ease: "power1.inOut", onComplete: function() {
        gsap.to($selectedCard, { x: 0, duration: 0.1 });
      }});
      $selectedCard.css("border-color", "#FF453A");

      $("#wrong-svg-box").css("display", "block");
      gsap.fromTo("#wrong-svg-box", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.5)" });
      
      gsap.delayedCall(1.0, function() {
        gsap.to("#wrong-svg-box", { scale: 0, opacity: 0, duration: 0.2, ease: "power2.in", onComplete: function() {
          $("#wrong-svg-box").css("display", "none");
          
          gsap.delayedCall(1.0, function() {
            if (currentQuestionAudio) {
              playAudioFile(currentQuestionAudio); 
            }
            isAnimating = false; 
          });
        }});
      });
    }
  }

  // (showGameOverScreen, shuffleArray 등 엔딩 연출 파트는 이전 코드 스펙 그대로 보존 유지됩니다)
  function showGameOverScreen() {
    if (currentQuestionAudio) currentQuestionAudio.pause();
    playAudioFile(audioAssets.ending);
    $("#game-over-screen").css("display", "flex");
    gsap.fromTo("#game-over-screen", { opacity: 0 }, { opacity: 1, duration: 0.5 });
    $("#ending-lottie-container").empty();
    endingLottieInstance = lottie.loadAnimation({
      container: document.getElementById("ending-lottie-container"),
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: "./assets/lottie/fireworks.json" 
    });
    gsap.fromTo("#restart-btn", { scale: 0.8 }, { scale: 1, duration: 0.6, yoyo: true, repeat: -1, ease: "power1.inOut" });
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
});
