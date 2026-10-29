// 페이지 내의 모든 <a> 태그를 가져옵니다.
const links = document.querySelectorAll('a');

// 현재 URL에 파라미터가 있는지 확인 (예: ?name=홍길동)
const currentSearch = window.location.search;

if (currentSearch) {
    links.forEach(link => {
        // 기존 링크 주소 (예: ./game1/index.html)
        const href = link.getAttribute('href');
        
        // 외부에 있는 완전한 다른 사이트 링크가 아니라 내 게임 폴더 링크일 때만 파라미터 추가
        if (href && !href.startsWith('http') && !href.startsWith('//')) {
            // 이미 링크 뒤에 다른 파라미터(?)가 붙어 있는지 체크 후 결합
            if (href.includes('?')) {
                // 기존 파라미터가 있으면 &로 연결 (예: index.html?stage=1&name=홍길동)
                link.setAttribute('href', href + currentSearch.replace('?', '&'));
            } else {
                // 파라미터가 없으면 ?로 연결 (예: index.html?name=홍길동)
                link.setAttribute('href', href + currentSearch);
            }
        }
    });
}
