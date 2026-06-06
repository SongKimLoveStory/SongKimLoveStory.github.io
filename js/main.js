/* ===========================
   Wedding Invitation - Main JS
   info.json에서 데이터를 로드하여 페이지를 렌더링합니다.
   =========================== */

(function () {
  'use strict';

  var INFO = null;

  /* ---------------------------
     info.json 로드 후 초기화
     --------------------------- */
  fetch('info.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      INFO = data;
      init();
    })
    .catch(function (err) {
      console.error('info.json 로드 실패:', err);
    });

  function init() {
    renderHero();
    renderGreeting();
    renderCalendar();
    renderGallery();
    renderVenue();
    renderTransport();
    renderAccounts();
    renderFooter();
    updateMeta();

    initScrollAnimations();
    initCollapsibles();
    initTabs();
    initCopyButtons();
    initNaviButtons();
    initShare();
    initFallingLeaves();
  }

  /* ---------------------------
     날짜 파싱 헬퍼
     --------------------------- */
  function getWeddingDate() {
    var parts = INFO.wedding.date.split('-');
    var time = INFO.wedding.time.split(':');
    return new Date(
      parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]),
      parseInt(time[0]), parseInt(time[1])
    );
  }

  /* ---------------------------
     렌더: 히어로
     --------------------------- */
  function renderHero() {
    document.getElementById('heroImg').src = INFO.heroPhoto;
    document.getElementById('heroGroom').textContent = INFO.groom.name;
    document.getElementById('heroBride').textContent = INFO.bride.name;
    document.getElementById('heroDate').textContent = INFO.wedding.dateLabel;
    document.getElementById('heroVenue').textContent = INFO.venue.name + ' ' + INFO.venue.hall;

    document.title = '결혼합니다 - ' + INFO.groom.name + ' ♥ ' + INFO.bride.name;
  }

  /* ---------------------------
     스크롤 낙엽 장식
     --------------------------- */
  function initFallingLeaves() {
    var layer = document.getElementById('fallingLeaves');
    if (!layer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var palette = ['#d85f4b', '#e99c61', '#f2c9a2', '#f5dfc4', '#c96f55'];
    var leafCount = window.innerWidth <= 480 ? 18 : 26;
    var leaves = [];
    var fragment = document.createDocumentFragment();

    layer.innerHTML = '';

    for (var i = 0; i < leafCount; i += 1) {
      var leaf = document.createElement('span');
      var size = 12 + ((i * 7) % 18);
      var isPetal = i % 5 === 0;

      leaf.className = 'falling-leaf' + (isPetal ? ' is-petal' : '');
      leaf.style.setProperty('--leaf-size', size + 'px');
      leaf.style.setProperty('--leaf-color', palette[i % palette.length]);
      leaf.style.setProperty('--leaf-opacity', (0.22 + ((i % 4) * 0.07)).toFixed(2));

      leaves.push({
        el: leaf,
        x: 6 + ((i * 37 + 8) % 88),
        height: size * (isPetal ? 1 : 1.55),
        startY: -160 - ((i * 53) % 420),
        bottom: (i * 5) % 22,
        fallStart: Math.max(0, (i / leafCount) * 0.18 - 0.04),
        fallEnd: 0.18 + (i / leafCount) * 0.76,
        sway: 7 + ((i % 5) * 5),
        phase: i * 41,
        startRotate: -70 + ((i * 31) % 140),
        endRotate: -48 + ((i * 29) % 96),
        scale: 0.78 + ((i % 5) * 0.08),
        maxOpacity: 0.22 + ((i % 4) * 0.05)
      });

      fragment.appendChild(leaf);
    }

    layer.appendChild(fragment);

    var ticking = false;

    function updateLeaves() {
      var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      var viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      var scrollMax = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
      var progress = Math.min(1, Math.max(0, scrollY / scrollMax));

      leaves.forEach(function (leaf) {
        var rawProgress = (progress - leaf.fallStart) / (leaf.fallEnd - leaf.fallStart);
        var leafProgress = Math.min(1, Math.max(0, rawProgress));
        var eased = 1 - Math.pow(1 - leafProgress, 3);
        var landedY = viewportHeight - (leaf.height * leaf.scale) - leaf.bottom;
        var y = leaf.startY + ((landedY - leaf.startY) * eased);
        var x = viewportWidth * (leaf.x / 100);
        var sway = leafProgress < 1 ? Math.sin((scrollY + leaf.phase) * 0.012) * leaf.sway : 0;
        var rotate = leaf.startRotate + ((leaf.endRotate - leaf.startRotate) * eased);
        var opacity = Math.min(leaf.maxOpacity, Math.max(0, leafProgress * leaf.maxOpacity * 1.8));

        leaf.el.style.opacity = opacity.toFixed(3);
        leaf.el.style.transform =
          'translate3d(' + (x + sway).toFixed(2) + 'px, ' +
          y.toFixed(2) + 'px, 0) rotate(' + rotate.toFixed(2) + 'deg) scale(' +
          leaf.scale.toFixed(2) + ')';
      });

      ticking = false;
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateLeaves);
    }

    updateLeaves();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
  }

  /* ---------------------------
     렌더: 인사말 & 혼주
     --------------------------- */
  function renderGreeting() {
    // 인사말
    var greetingEl = document.getElementById('greetingText');
    greetingEl.innerHTML = INFO.greeting.replace(/\n/g, '<br>');

    // 혼주 정보
    var parentsEl = document.getElementById('parentsInfo');
    var sides = [
      { parent: INFO.groom, label: INFO.groom.relation },
      { parent: INFO.bride, label: INFO.bride.relation }
    ];
    sides.forEach(function (side) {
      var row = document.createElement('div');
      row.className = 'parents-row';
      row.innerHTML =
        '<span class="parent-names">' + side.parent.father.name + ' · ' + side.parent.mother.name + '</span>' +
        '<span class="child-label">의 ' + side.label + '</span>' +
        '<span class="child-name">' + side.parent.name + '</span>';
      parentsEl.appendChild(row);
    });

    // 연락처 버튼
    var contactEl = document.getElementById('contactButtons');
    var contactSides = [
      { label: '신랑측', person: INFO.groom },
      { label: '신부측', person: INFO.bride }
    ];
    contactSides.forEach(function (side) {
      var group = document.createElement('div');
      group.className = 'contact-group';
      group.innerHTML =
        '<span class="contact-label">' + side.label + '</span>' +
        contactBtn(side.person.name, side.person.phone) +
        contactBtn('아버지', side.person.father.phone) +
        contactBtn('어머니', side.person.mother.phone);
      contactEl.appendChild(group);
    });
  }

  function contactBtn(label, phone) {
    return '<a href="tel:' + phone + '" class="contact-btn">' + label + ' <span class="icon-phone">&#9742;</span></a>';
  }

  /* ---------------------------
     렌더: 캘린더
     --------------------------- */
  function renderCalendar() {
    var container = document.querySelector('.calendar-widget');
    if (!container) return;

    var wedding = getWeddingDate();
    var year = wedding.getFullYear();
    var month = wedding.getMonth();
    var weddingDay = wedding.getDate();

    var monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    var title = document.createElement('p');
    title.className = 'calendar-month-title';
    title.textContent = year + '년 ' + monthNames[month];
    container.appendChild(title);

    var grid = document.createElement('div');
    grid.className = 'calendar-grid';

    ['일', '월', '화', '수', '목', '금', '토'].forEach(function (name) {
      var header = document.createElement('div');
      header.className = 'day-header';
      header.textContent = name;
      grid.appendChild(header);
    });

    var firstDay = new Date(year, month, 1).getDay();
    var lastDate = new Date(year, month + 1, 0).getDate();

    for (var i = 0; i < firstDay; i++) {
      var empty = document.createElement('div');
      empty.className = 'day-cell empty';
      grid.appendChild(empty);
    }

    for (var d = 1; d <= lastDate; d++) {
      var cell = document.createElement('div');
      cell.className = 'day-cell';
      cell.textContent = d;
      var dayOfWeek = new Date(year, month, d).getDay();
      if (dayOfWeek === 0) cell.classList.add('sunday');
      if (dayOfWeek === 6) cell.classList.add('saturday');
      if (d === weddingDay) cell.classList.add('wedding-day');
      grid.appendChild(cell);
    }
    container.appendChild(grid);

    // D-day
    var ddayEl = document.querySelector('.dday-number');
    if (ddayEl) {
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var weddingDateOnly = new Date(year, month, weddingDay);
      var diff = Math.ceil((weddingDateOnly - today) / (1000 * 60 * 60 * 24));
      ddayEl.textContent = diff > 0 ? 'D-' + diff : diff === 0 ? 'D-Day' : 'D+' + Math.abs(diff);
    }

    // Google Calendar
    var googleCalBtn = document.getElementById('btn-google-cal');
    if (googleCalBtn) {
      var startDate = formatGoogleDate(wedding);
      var endDate = formatGoogleDate(new Date(wedding.getTime() + 2 * 60 * 60 * 1000));
      googleCalBtn.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
        + '&text=' + encodeURIComponent('결혼식 - ' + INFO.groom.name + ' & ' + INFO.bride.name)
        + '&dates=' + startDate + '/' + endDate
        + '&location=' + encodeURIComponent(INFO.venue.address)
        + '&details=' + encodeURIComponent(INFO.venue.name + '에서 진행되는 결혼식');
    }

    // .ics
    var icsBtn = document.getElementById('btn-ics-download');
    if (icsBtn) {
      icsBtn.addEventListener('click', function (e) {
        e.preventDefault();
        downloadICS(wedding);
      });
    }
  }

  function formatGoogleDate(date) {
    return date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate())
      + 'T' + pad(date.getHours()) + pad(date.getMinutes()) + '00';
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function downloadICS(wedding) {
    var end = new Date(wedding.getTime() + 2 * 60 * 60 * 1000);
    var ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
      'DTSTART:' + formatGoogleDate(wedding),
      'DTEND:' + formatGoogleDate(end),
      'SUMMARY:결혼식 - ' + INFO.groom.name + ' & ' + INFO.bride.name,
      'LOCATION:' + INFO.venue.address,
      'DESCRIPTION:' + INFO.venue.name,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'wedding.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ---------------------------
     렌더: 갤러리
     --------------------------- */
  function renderGallery() {
    var grid = document.querySelector('.gallery-grid');
    var overlay = document.getElementById('galleryOverlay');
    var swiperWrapper = document.querySelector('#gallerySwiper .swiper-wrapper');
    var closeBtn = document.getElementById('galleryClose');
    if (!grid || !overlay || !swiperWrapper) return;

    var images = INFO.gallery;

    images.forEach(function (src, index) {
      var thumb = document.createElement('div');
      thumb.className = 'gallery-thumb';
      thumb.setAttribute('data-index', index);
      var img = document.createElement('img');
      img.src = src;
      img.alt = '갤러리 사진 ' + (index + 1);
      img.loading = 'lazy';
      thumb.appendChild(img);
      grid.appendChild(thumb);
    });

    images.forEach(function (src, index) {
      var slide = document.createElement('div');
      slide.className = 'swiper-slide';
      var img = document.createElement('img');
      img.src = src;
      img.alt = '갤러리 사진 ' + (index + 1);
      slide.appendChild(img);
      swiperWrapper.appendChild(slide);
    });

    var gallerySwiper = new Swiper('#gallerySwiper', {
      loop: true,
      pagination: { el: '.swiper-pagination', clickable: true },
      navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
      zoom: true
    });

    grid.addEventListener('click', function (e) {
      var thumb = e.target.closest('.gallery-thumb');
      if (!thumb) return;
      gallerySwiper.slideToLoop(parseInt(thumb.getAttribute('data-index'), 10), 0);
      overlay.classList.add('active');
      document.body.style.overflow = '';
      gallerySwiper.update();
    });

    closeBtn.addEventListener('click', function () {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  /* ---------------------------
     렌더: 오시는 길
     --------------------------- */
  function renderVenue() {
    document.getElementById('venueName').textContent = INFO.venue.name;
    document.getElementById('venueAddress').textContent = INFO.venue.address;
    var telEl = document.getElementById('venueTel');
    telEl.innerHTML = '<a href="tel:' + INFO.venue.tel + '">' + INFO.venue.tel + '</a>';

    // 네이버 지도 로드
    if (INFO.naverMapClientId) {
      var script = document.createElement('script');
      script.src = 'https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=' + INFO.naverMapClientId;
      script.onload = function () {
        var mapContainer = document.querySelector('.map-container');
        mapContainer.innerHTML = '<div id="naverMap" style="width:100%;aspect-ratio:4/3;"></div>';
        var map = new naver.maps.Map('naverMap', {
          center: new naver.maps.LatLng(INFO.venue.lat, INFO.venue.lng),
          zoom: 16
        });
        new naver.maps.Marker({
          position: new naver.maps.LatLng(INFO.venue.lat, INFO.venue.lng),
          map: map
        });
      };
      document.head.appendChild(script);
    }
  }

  /* ---------------------------
     렌더: 교통 안내
     --------------------------- */
  function renderTransport() {
    var container = document.getElementById('transportContent');
    if (!container) return;

    var items = [
      // { title: '셔틀버스', content: INFO.transport.shuttle },
      { title: '자가용 안내', content: INFO.transport.car },
      { title: '대중교통', content: INFO.transport.publicTransit }
    ];

    items.forEach(function (item) {
      var div = document.createElement('div');
      div.className = 'collapsible';
      div.innerHTML =
        '<button class="collapsible-header" aria-expanded="false">' +
          '<span>' + item.title + '</span>' +
          '<span class="collapsible-arrow">&#9662;</span>' +
        '</button>' +
        '<div class="collapsible-body"><p>' + item.content + '</p></div>';
      container.appendChild(div);
    });
  }

  /* ---------------------------
     렌더: 축의금 계좌
     --------------------------- */
  function renderAccounts() {
    renderAccountTab('tab-groom', INFO.accounts.groom);
    renderAccountTab('tab-bride', INFO.accounts.bride);
  }

  function renderAccountTab(containerId, accounts) {
    var container = document.getElementById(containerId);
    if (!container) return;

    accounts.forEach(function (acc) {
      var div = document.createElement('div');
      div.className = 'account-item';
      div.innerHTML =
        '<div class="account-info">' +
          '<span class="account-bank">' + acc.bank + '</span>' +
          '<span class="account-holder">' + acc.holder + '</span>' +
        '</div>' +
        '<div class="account-row">' +
          '<span class="account-number">' + acc.number + '</span>' +
          '<button class="btn-copy" data-copy="' + acc.number + '" aria-label="계좌번호 복사">복사</button>' +
        '</div>';
      container.appendChild(div);
    });
  }

  /* ---------------------------
     렌더: 푸터
     --------------------------- */
  function renderFooter() {
    document.getElementById('footerNames').textContent = INFO.groom.name + ' & ' + INFO.bride.name;
    document.getElementById('footerDate').textContent = INFO.wedding.date.replace(/-/g, '. ') + '.';
  }

  /* ---------------------------
     메타 태그 업데이트
     --------------------------- */
  function updateMeta() {
    var ogTitle = document.querySelector('meta[property="og:title"]');
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogTitle) ogTitle.content = INFO.groom.name + ' ♥ ' + INFO.bride.name + ' 결혼합니다';
    if (ogDesc) ogDesc.content = INFO.wedding.dateLabel + ' | ' + INFO.venue.name;
  }

  /* ---------------------------
     스크롤 애니메이션
     --------------------------- */
  function initScrollAnimations() {
    var elements = document.querySelectorAll('.animate-on-scroll');
    if (!elements.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    elements.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------
     접이식 (Collapsible)
     --------------------------- */
  function initCollapsibles() {
    document.getElementById('transportContent').addEventListener('click', function (e) {
      var header = e.target.closest('.collapsible-header');
      if (!header) return;

      var body = header.nextElementSibling;
      var isOpen = body.classList.contains('open');

      this.querySelectorAll('.collapsible-body').forEach(function (b) { b.classList.remove('open'); });
      this.querySelectorAll('.collapsible-header').forEach(function (h) { h.setAttribute('aria-expanded', 'false'); });

      if (!isOpen) {
        body.classList.add('open');
        header.setAttribute('aria-expanded', 'true');
      }
    });
  }

  /* ---------------------------
     탭 (축의금)
     --------------------------- */
  function initTabs() {
    var tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tabId = this.getAttribute('data-tab');
        tabBtns.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
        var target = document.getElementById('tab-' + tabId);
        if (target) target.classList.add('active');
      });
    });
  }

  /* ---------------------------
     클립보드 복사
     --------------------------- */
  function initCopyButtons() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.btn-copy');
      if (!btn) return;
      var text = btn.getAttribute('data-copy');
      if (!text) return;
      navigator.clipboard.writeText(text).then(function () {
        showToast('계좌번호가 복사되었습니다');
      }).catch(function () {
        fallbackCopy(text);
        showToast('계좌번호가 복사되었습니다');
      });
    });
  }

  function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  /* ---------------------------
     토스트
     --------------------------- */
  function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 2000);
  }

  /* ---------------------------
     네비게이션 딥링크
     --------------------------- */
  function initNaviButtons() {
    document.querySelectorAll('.btn-navi').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var type = this.getAttribute('data-navi');
        var v = INFO.venue;
        switch (type) {
          case 'naver':
            window.open('https://map.naver.com/v5/search/' + encodeURIComponent(v.address), '_blank');
            break;
          case 'kakao':
            window.open('https://map.kakao.com/link/to/' + encodeURIComponent(v.name) + ',' + v.lat + ',' + v.lng, '_blank');
            break;
          // case 'tmap':
          //   window.open('https://apis.openapi.sk.com/tmap/app/routes?appKey=&name=' + encodeURIComponent(v.name) + '&lon=' + v.lng + '&lat=' + v.lat, '_blank');
          //   break;
        }
      });
    });
  }

  /* ---------------------------
     공유
     --------------------------- */
  function initShare() {
    var kakaoBtn = document.getElementById('btn-kakao-share');
    if (kakaoBtn) {
      kakaoBtn.addEventListener('click', function () {
        if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
          Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
              title: INFO.groom.name + ' ♥ ' + INFO.bride.name + ' 결혼합니다',
              description: INFO.venue.name,
              imageUrl: window.location.origin + '/' + INFO.heroPhoto,
              link: { mobileWebUrl: window.location.href, webUrl: window.location.href }
            },
            buttons: [{
              title: '청첩장 보기',
              link: { mobileWebUrl: window.location.href, webUrl: window.location.href }
            }]
          });
        } else {
          showToast('카카오 SDK가 설정되지 않았습니다');
        }
      });
    }

    var linkBtn = document.getElementById('btn-link-copy');
    if (linkBtn) {
      linkBtn.addEventListener('click', function () {
        navigator.clipboard.writeText(window.location.href).then(function () {
          showToast('링크가 복사되었습니다');
        }).catch(function () {
          fallbackCopy(window.location.href);
          showToast('링크가 복사되었습니다');
        });
      });
    }
  }

})();
