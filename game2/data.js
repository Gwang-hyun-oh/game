// 색상 매칭 게임 전용 Stage 풀 (총 5개 카테고리 고도화 버전)
const gameStagePool = [

    {
        theme: "color-vehicles",
        title: "부릉부릉 탈것 색상 맞추기",
        description: "멋진 자동차와 알맞은 색상을 선으로 연결해 보세요!",
        leftSide: [
            { id: "L1", matchId: "RED", label: "소방차", lottie: "firetruck.json", lottie_black: "firetruck_black.json" },
            { id: "L2", matchId: "YELLOW", label: "유치원 버스", lottie: "bus.json", lottie_black: "bus_black.json" },
            { id: "L3", matchId: "BLUE", label: "경찰차", lottie: "police1.json", lottie_black: "police1_black.json" }
        ],
        rightSide: [
            { id: "R1", matchId: "YELLOW", label: "노랑", color: "#facc15" },
            { id: "R2", matchId: "RED", label: "빨강", color: "#ef4444" },
            { id: "R3", matchId: "BLUE", label: "파랑", color: "#3b82f6" }
        ]
    },
    {
        theme: "color-fruits",
        title: "새콤달콤 과일 색상 맞추기",
        description: "맛있는 과일들이 제 색을 찾을 수 있게 도와주세요!",
        leftSide: [
            { id: "L1", matchId: "GREEN", label: "수박", lottie: "watermelon.json", lottie_black: "watermelon_black.json" },
            { id: "L2", matchId: "PURPLE", label: "포도", lottie: "grape.json", lottie_black: "grape_black.json" },
            { id: "L3", matchId: "ORANGE", label: "오렌지", lottie: "orange.json", lottie_black: "orange_black.json" }
        ],
        rightSide: [
            { id: "R1", matchId: "PURPLE", label: "보라", color: "#a855f7" },
            { id: "R2", matchId: "ORANGE", label: "주황", color: "#f97316" },
            { id: "R3", matchId: "GREEN", label: "초록", color: "#22c55e" }
        ]
    },
  {
        theme: "color-sea",
        title: "출렁출렁 바다 친구들 색상 맞추기",
        description: "귀여운 바다 생물들과 어울리는 색을 찾아 연결해 볼까요?",
        leftSide: [
            { id: "L1", matchId: "NAVY", label: "고래", lottie: "whale.json", lottie_black: "whale_black.json" },
            { id: "L2", matchId: "CORAL", label: "불가사리", lottie: "starfish.json", lottie_black: "starfish_black.json" },
            { id: "L3", matchId: "EMERALD", label: "거북이", lottie: "turtle.json", lottie_black: "turtle_black.json" }
        ],
        rightSide: [
            { id: "R1", matchId: "CORAL", label: "산호색", color: "#fb7185" },
            { id: "R2", matchId: "EMERALD", label: "청록색", color: "#0d9488" },
            { id: "R3", matchId: "NAVY", label: "남색", color: "#1e3a8a" }
        ]
    },
];
