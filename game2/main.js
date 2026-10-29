$(document).ready(function() {
    function shuffle(array) {
        return array.sort(() => Math.random() - 0.5);
    }

    const svg = document.getElementById('svg-layer');
    let activeLine = null;
    let startNode = null;
    let isDragging = false;
    let currentData = null;
    let lottieInstances = {}; 
    let index = 0;

    // ==========================================
    // 1. 게임 엔진 초기화 및 리렌더링
    // ==========================================
    function initGame() {
        $(svg).empty();
        $('#left-column').empty();
        $('#right-column').empty();
        $('#success-modal').removeClass('active');
        gsap.set('#success-modal', { display: 'none', opacity: 0 });

        // 기존 로띠 인스턴스 소멸 (메모리 가드)
        Object.keys(lottieInstances).forEach(id => {
            if (lottieInstances[id]) lottieInstances[id].destroy();
        });
        lottieInstances = {};

        // 스테이지 풀에서 랜덤 추출
        const randomIdx = Math.floor(Math.random() * gameStagePool.length);
        currentData = gameStagePool[index];

        console.log(currentData)
        console.log(index)

        $('#game-title').text(currentData.title);
        $('#game-desc').text(currentData.description);

        const $leftCol = $('#left-column');
        const $rightCol = $('#right-column');

        // 왼쪽 오브젝트 배치
        shuffle([...currentData.leftSide]).forEach(item => {
            const $itemNode = $(`
                <div class="item object-node" id="${item.id}" data-match="${item.matchId}">
                    <div class="lottie-view" id="view-${item.id}"></div>
                </div>
            `);
            $itemNode.css('border-color', '#e2e8f0');
            $leftCol.append($itemNode);

            // 흑백 로띠 로드
            lottieInstances[item.id] = lottie.loadAnimation({
                container: document.getElementById(`view-${item.id}`),
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: `./assets/lottie/${item.lottie_black}`
            });
        });

        // 오른쪽 컬러 노드 배치
        shuffle([...currentData.rightSide]).forEach(item => {
            const $node = $(`<div class="item color-node" id="${item.id}" data-match="${item.matchId}">${item.label}</div>`);
            $node.css('background-color', item.color || '#94a3b8');
            $rightCol.append($node);
        });

        gsap.set('.item', { opacity: 0, scale: 0.3 });
        
        // 왼쪽 컬럼 노드들은 왼쪽(-50px)에서, 오른쪽 컬럼 노드들은 오른쪽(50px)에서 제자리로 들어옵니다.
        gsap.set('#left-column .item', { x: -50 });
        gsap.set('#right-column .item', { x: 50 });

        // 좌우 아이템 전체를 부드러운 탄성 효과와 함께 정렬합니다.
        gsap.to('.item', {
            opacity: 1,
            scale: 1,
            x: 0,
            duration: 0.6,
            stagger: 0.08, // 0.08초 간격으로 한 놈씩 톡! 톡! 톡! 튀어나옵니다 (UI 개발 마감 포인트)
            ease: "elastic.out(1, 0.5)", // 탱글한 쿠션감 추가
            delay: 0.1
        });

        if(gameStagePool.length == (index + 1)){
            index = 0;
        } else{
            index++;
        }
    }

    //initGame();

    $('#start-btn').on('click', function() {
        gsap.to('#intro-screen', {
            opacity: 0,
            duration: 0.35,
            ease: "power2.out",
            onStart: function() {
                initGame(); // 👈 기존 onComplete에서 onStart 시점으로 변경하여 모션 레이어링을 부드럽게 연결!
            },
            onComplete: function() {
                $('#intro-screen').css('display', 'none');
            }
        });
    });

    // ==========================================
    // 2. SVG 드래그 인터랙션 핵심 로직
    // ==========================================
    function getNodeCenter(element) {
        if (!element) return { x: 0, y: 0 };
        const domElement = element.jquery ? element[0] : element; // 제이쿼리 객체 안전성 가드
        const rect = domElement.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2 - svgRect.left,
            y: rect.top + rect.height / 2 - svgRect.top
        };
    }

    // 드래그 시작 (공통 바인딩)
    $(document).on('mousedown touchstart', '.item.object-node:not(.connected)', function(e) {
        isDragging = true;
        startNode = this;
        const center = getNodeCenter(startNode);

        activeLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        activeLine.setAttribute('class', 'game-line drawing');
        activeLine.setAttribute('x1', center.x);
        activeLine.setAttribute('y1', center.y);
        activeLine.setAttribute('x2', center.x);
        activeLine.setAttribute('y2', center.y);
        svg.appendChild(activeLine);
        
        gsap.to(startNode, { scale: 1.08, duration: 0.1 });
    });

    // 드래그 중 (모바일 인터벤션 에러 봉쇄)
    document.addEventListener('touchmove', function(e) {
        if (!isDragging || !activeLine) return;
        e.preventDefault(); 

        const touch = e.touches[0]; // 안전한 첫 번째 터치 좌표 타겟팅
        const svgRect = svg.getBoundingClientRect();
        
        const currentX = touch.clientX - svgRect.left;
        const currentY = touch.clientY - svgRect.top;
        
        activeLine.setAttribute('x2', currentX);
        activeLine.setAttribute('y2', currentY);
    }, { passive: false });

    // 데스크톱 마우스 드래그
    $(document).on('mousemove', function(e) {
        if (!isDragging || !activeLine || window.matchMedia("(pointer: coarse)").matches) return;
        
        const svgRect = svg.getBoundingClientRect();
        const currentX = e.clientX - svgRect.left;
        const currentY = e.clientY - svgRect.top;
        
        activeLine.setAttribute('x2', currentX);
        activeLine.setAttribute('y2', currentY);
    });

    // 드래그 종료 및 동적 색상 매칭 판정
    $(document).on('mouseup touchend', function(e) {
        if (!isDragging) return;
        isDragging = false;

        let clientX = 0;
        let clientY = 0;

        if (e.type === 'touchend') {
            const orig = e.originalEvent;
            const touchList = (orig.changedTouches && orig.changedTouches.length) ? orig.changedTouches[0] : 
                              ((orig.touches && orig.touches.length) ? orig.touches[0] : null);
            if (touchList) {
                clientX = touchList.clientX;
                clientY = touchList.clientY;
            }
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // non-finite 좌표 안전성 가드
        if (clientX === undefined || clientY === undefined || !isFinite(clientX) || !isFinite(clientY)) {
            removeActiveLine();
            return;
        }

        const endElement = document.elementFromPoint(clientX, clientY);
        const $endNode = $(endElement).closest('.item.color-node');

        gsap.to(startNode, { scale: 1.0, duration: 0.2 });

        // 인스턴스가 존재할 때만 안전하게 제어
        if (activeLine && $endNode.length > 0 && !$endNode.hasClass('connected')) {
            const startMatch = $(startNode).data('match');
            const endMatch = $endNode.data('match');

            // 🎯 정답 일치 가이드 매칭 성공 시
            if (startMatch === endMatch) {
                const endCenter = getNodeCenter($endNode); 
                activeLine.setAttribute('x2', endCenter.x);
                activeLine.setAttribute('y2', endCenter.y);
                activeLine.setAttribute('class', 'game-line success');
                
                // ⭕ [에러 완벽 해결 포인트] .style.stroke 대신 setAttribute로 안전하게 주입합니다.
                const matchedColor = $endNode.css('background-color');
                activeLine.setAttribute('stroke', matchedColor);
                $endNode.css("border-color", matchedColor);

                const nodeId = $(startNode).attr('id');
                $(startNode).addClass('connected');
                $endNode.addClass('connected');
                $(startNode).css('border-color', matchedColor);

                // 컬러 로띠 인스턴스 실시간 스위칭 교체
                const matchedItemData = currentData.leftSide.find(item => item.id === nodeId);
                if (matchedItemData) {
                    if (lottieInstances[nodeId]) lottieInstances[nodeId].destroy();

                    const $targetView = $(`#view-${nodeId}`);
                    gsap.set($targetView, { opacity: 0, scale: 0.8 });

                    lottieInstances[nodeId] = lottie.loadAnimation({
                        container: document.getElementById(`view-${nodeId}`),
                        renderer: 'svg',
                        loop: true,
                        autoplay: true,
                        path: `./assets/lottie/${matchedItemData.lottie}`
                    });

                    gsap.to($targetView, { 
                        opacity: 1, 
                        scale: 1, 
                        duration: 0.6, 
                        ease: "elastic.out(1, 0.4)" 
                    });
                }

                activeLine = null;
                checkGameOver();
                return;
            }
            else {
                triggerWrongFeedback();
            }
        }
        else {
            triggerWrongFeedback();
        }

        removeActiveLine();
    });

     function triggerWrongFeedback() {
        const $marker = $('#fail-marker');
        
        gsap.killTweensOf($marker); 
        gsap.set($marker, { scale: 0, opacity: 0 }); 
        
        const tl = gsap.timeline();
        tl.to($marker, {
            scale: 1,
            opacity: 1,
            duration: 0.35,
            ease: "elastic.out(1.1, 0.4)" 
        })
        .to($marker, {
            scale: 0.7,
            opacity: 0,
            duration: 0.2,
            delay: 0.4, 
            ease: "power2.in"
        });
    }

    function removeActiveLine() {
        if (activeLine) {
            const startCenter = getNodeCenter(startNode);
            gsap.to(activeLine, {
                attr: { x2: startCenter.x, y2: startCenter.y },
                duration: 0.3,
                ease: "power2.out",
                onComplete: function() {
                    if (activeLine && activeLine.parentNode) {
                        activeLine.parentNode.removeChild(activeLine);
                    }
                    activeLine = null;
                }
            });
        }
    }

    function checkGameOver() {
        if ($('.item.connected').length === (currentData.leftSide.length * 2)) {
            setTimeout(() => {
                gsap.set('#success-modal', { display: 'flex' });
                gsap.to('#success-modal', { opacity: 1, duration: 0.4, ease: "power2.out" });
            }, 800); 
        }
    }

    $('#next-btn').on('click', function() {
        initGame();
    });

    // 글로벌 모바일 확대 및 핀치 줌 가드
    document.addEventListener('touchmove', function (e) {
        if (e.scale !== undefined && e.scale !== 1) e.preventDefault();
    }, { passive: false });
});
