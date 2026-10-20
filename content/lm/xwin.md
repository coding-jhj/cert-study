# X 윈도와 데스크톱 환경

<div class="summary">

- **X 윈도**는 클라이언트/서버 구조입니다. **X 서버**는 화면·키보드·마우스를 다루는 쪽, **X 클라이언트**는 화면에 그림을 요청하는 **응용 프로그램**이고, 둘은 **X 프로토콜**로 통신합니다.
- **원격 실행**은 프로그램이 도는 쪽이 **X 클라이언트**, 화면을 보는 쪽이 **X 서버**입니다. 클라이언트에서 **`DISPLAY`** 환경 변수를 바꾸고, 서버에서 **`xhost`**로 접근을 허가합니다.
- **GUI 구성**은 **디스플레이 매니저(로그인)** → **윈도 매니저(창 관리)** → **데스크톱 환경(전체 모습)**으로 층을 나눕니다.
- **라이브러리**는 GNOME이 **GTK+**, KDE가 **Qt**입니다.
- **부팅 모드**는 `systemctl set-default graphical.target`(X 윈도)과 `multi-user.target`(텍스트)입니다.

</div>

## 1. X 윈도의 구조

| 구성 요소 | 하는 일 |
|---|---|
| **X 서버** | 사용자 앞의 화면, 키보드, 마우스를 관리하며 **그림을 실제로 표시**하는 쪽 |
| **X 클라이언트** | 브라우저, 편집기처럼 **화면 출력을 요청하는 응용 프로그램** |
| **X 프로토콜** | 서버와 클라이언트가 **서로 통신**하는 규약 |
| Xlib | C로 구현된 **저수준 클라이언트 라이브러리**. X 서버와 대화하며 키보드·마우스 반응 같은 단순한 기능만 제공 |
| XCB | **Xlib를 대체**하려고 등장한 라이브러리 |

X 윈도 시스템 구현체는 **XFree86**(IBM 호환 PC용 유닉스 계열을 위해 1992년에 시작)에서 **X.Org**로 이어졌고, 차세대 디스플레이 서버로 **Wayland**가 있습니다.

### 원격으로 응용 프로그램 보내기

A 시스템의 Firefox를 B 시스템의 화면에 띄우려는 상황입니다.

| | A 시스템 | B 시스템 |
|---|---|---|
| 역할 | **X 클라이언트**(프로그램을 실행) | **X 서버**(화면을 보여 줌) |
| 할 일 | `DISPLAY`를 B로 바꿔 실행 | `xhost`로 A의 접근을 허가 |

```
(A) $ export DISPLAY=192.168.5.13:0     # 화면을 보낼 곳(B)을 지정
(B) $ xhost + 192.168.5.13             # A의 접근을 허가 (xhost 192.168.5.13 형식도 같은 뜻)
```

`DISPLAY` 값의 의미입니다. `:0`은 **로컬 시스템의 첫 번째 X 서버**, `:1`은 **두 번째 X 서버**입니다.

| 명령 | 하는 일 |
|---|---|
| `xhost + 호스트` | **IP 주소(호스트)** 단위로 X 서버 접근 허가 |
| `xauth list $DISPLAY` | X 서버가 만든 **인증키(쿠키)** 확인 |
| `xauth add $DISPLAY . 키값` | 원격지에서 전달받은 키 값을 **설치** |
| `xrandr -s 1024x768` | X 윈도 터미널에서 **해상도 변경** |

인증 키는 사용자의 홈 디렉터리 **`.Xauthority`** 파일에 저장됩니다.

> **함정** `xhost`는 **IP(호스트)** 기준 허가, `xauth`는 **키(쿠키)** 기준 인증입니다. 두 명령의 용도가 다릅니다. `xhost list`는 존재하지 않는 형식입니다.

## 2. 디스플레이 매니저 · 윈도 매니저 · 데스크톱 환경

| 층 | 하는 일 | 예 |
|---|---|---|
| **디스플레이 매니저** | 부팅 때 **로그인 화면**을 띄우고 **사용자 이름과 암호를 확인해 세션을 시작** | GDM(GNOME), KDM(KDE) |
| **윈도 매니저** | 창의 배치와 표현(창 열기·닫기, 최소화·최대화, 이동, 크기 조정) | Metacity, Mutter(GNOME), **Kwin**(KDE), **Xfwm**(Xfce), Afterstep, Enlightenment, Window Maker |
| **데스크톱 환경** | 파일 관리자, 아이콘, 창, 도구 모음, 배경 화면, 위젯 등 **GUI 환경 전체** | GNOME, KDE, **Xfce**, LXDE |

> **함정** **Xfce는 윈도 매니저가 아니라 데스크톱 환경**입니다. 윈도 매니저 목록에서 틀린 것을 고르라면 Xfce(또는 GNOME, LXDE)입니다. Xfce의 윈도 매니저는 Xfwm입니다.

### GNOME과 KDE

| | GNOME | KDE |
|---|---|---|
| 라이브러리 | **GTK+**(LGPL, GNU 프로젝트) | **Qt** |
| 윈도 매니저 | Metacity, Mutter | **Kwin** |
| 파일 관리자 | **Nautilus** | Dolphin 등 |
| 이미지 뷰어 | Eog | **Gwenview** |
| 기타 | 상단 패널에 "프로그램, 위치" 메뉴가 있는 화면은 **GNOME Classic** | Konqueror는 KDE 쪽이므로 GNOME과 거리가 멂 |

KDE는 리눅스뿐 아니라 FreeBSD, Solaris, OS X 등도 지원합니다. Metacity를 쓴다는 설명은 틀립니다(GNOME 쪽).

## 3. 응용 프로그램

| 프로그램 | 용도 |
|---|---|
| **Eog** | GNOME의 **이미지 뷰어** |
| **Gwenview** | KDE의 이미지 뷰어 |
| **Evince** | **PDF 문서** 뷰어 |
| **Totem** | **동영상** 재생 |
| **Gimp** | 그래픽·로고 디자인, **사진 편집**, 이미지 합성, 포맷 변환, 레이어 |
| ImageMagick | 명령행에서 이미지를 변환·편집 |
| LibreOffice **Writer** | 워드 프로세서 |
| LibreOffice **Calc** | **스프레드시트**(엑셀 대체). 숫자 표에서 다양한 계산 |
| LibreOffice **Impress** | **프레젠테이션**(파워포인트 대체) |
| LibreOffice **Draw** | 그림 도구 |
| gedit | GNOME 텍스트 편집기, kwrite는 KDE 편집기 |

스프레드시트를 실행하는 옛 명령은 `oocalc`(문서 작성기는 `oowriter`, 프레젠테이션은 `ooimpress`, 그리기는 `oodraw`)입니다.

## 4. 부팅 모드

CentOS 7은 런레벨 대신 **타깃(target)**을 씁니다.

| 하려는 일 | 명령 |
|---|---|
| X 윈도(그래픽) 모드로 부팅 | `systemctl set-default graphical.target` |
| 텍스트 모드로 부팅 | `systemctl set-default multi-user.target` |
| 현재 기본 부팅 모드 **확인** | `systemctl get-default` |
| 텍스트 모드에서 X 윈도 실행 | `startx` |

`set-default`는 **설정**, `get-default`는 **확인**입니다. 확인하는 과정에서 결과가 `graphical.target`이면 X 윈도 모드로 부팅되는 것입니다. `runlevel5.target`(그래픽)과 `runlevel3.target`(텍스트)은 같은 뜻의 옛 별칭입니다.

> **함정** 그래픽 모드의 이름은 `graphical.target`이고 옛 런레벨 표기로는 5(`runlevel5.target`)입니다. 텍스트 모드는 `multi-user.target`이고 옛 표기로는 3입니다. 회차에 따라 `graphical.target`이 정답으로 나오기도 하고 `runlevel5` 계열이 정답으로 나오기도 합니다. 보기에 `graphical.target`이 있으면 그것을, 없으면 `runlevel5` 쪽을 고릅니다. `graphic.target`, `x.target`처럼 이름이 틀린 것은 없는 타깃입니다.

## 5. 시험 직전 점검

> - X 윈도에서 **서버 = 화면 쪽**, **클라이언트 = 프로그램 쪽**입니다.
> - 원격 실행: 클라이언트에서 `DISPLAY` 변경, 서버에서 `xhost`로 허가합니다.
> - GTK+는 GNOME, Qt는 KDE입니다.
> - Xfce, LXDE는 데스크톱 환경, Kwin, Metacity, Mutter는 윈도 매니저입니다.
> - 로그인 담당은 디스플레이 매니저(GDM), 창 관리는 윈도 매니저입니다.
> - 이미지 뷰어 Eog, PDF Evince, 동영상 Totem, 사진 편집 Gimp.

## 6. OX 점검

| 문장 | 답 | 이유 |
|---|---|---|
| X 서버는 응용 프로그램이 실행되는 쪽이다. | X | 화면을 담당하는 쪽입니다. 응용 프로그램은 X 클라이언트입니다. |
| `DISPLAY=:1`은 두 번째 X 서버를 뜻한다. | O | `:0`이 첫 번째입니다. |
| Xfce는 윈도 매니저이다. | X | 데스크톱 환경입니다. |
| KDE의 기반 라이브러리는 Qt이다. | O | |
| Evince는 이미지 뷰어이다. | X | PDF 뷰어입니다. 이미지 뷰어는 Eog입니다. |
| `systemctl get-default`는 기본 부팅 모드를 설정한다. | X | 확인합니다. 설정은 `set-default`입니다. |
| 로그인 처리는 윈도 매니저가 한다. | X | 디스플레이 매니저가 합니다. |
| `xauth list $DISPLAY`는 인증키를 보여 준다. | O | |
