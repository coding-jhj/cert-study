# 네트워크 명령과 설정 파일

<div class="summary">

- **네임 서버**는 `/etc/resolv.conf`, **가상 도메인(IP-이름 연결)**은 `/etc/hosts`, **포트 번호표**는 `/etc/services`입니다.
- **호스트명·게이트웨이·네트워크 사용 여부**는 `/etc/sysconfig/network`, **인터페이스별 설정**은 `/etc/sysconfig/network-scripts/` 디렉터리입니다.
- **케이블 연결 상태**는 `ethtool`(또는 `mii-tool`), **MAC 주소 조회(이웃 호스트)**는 `arp`, **라우팅 테이블·게이트웨이**는 `route`·`ip route`·`netstat -r`입니다.
- **연결 상태(ESTABLISHED, SYN Flooding 점검)**는 `ss`와 `netstat`입니다.
- CentOS 7의 이더넷 장치명은 `eth0`이 아니라 **`enp0s3`** 형식입니다.

</div>

## 1. 설정 파일

| 파일 | 담는 내용 | 시험에 나온 설명 |
|---|---|---|
| **`/etc/hosts`** | `IP주소  호스트명` 대응표 | 가상 도메인 `www.ihd.or.kr`을 설정, 실습용 도메인 지정 |
| **`/etc/resolv.conf`** | `nameserver 168.126.63.1` 같은 **DNS 서버 주소** | DNS 서버 주소를 변경 |
| **`/etc/sysconfig/network`** | 네트워크 사용 유무, **호스트명**, **게이트웨이 주소**, NIS 도메인명 | 전체 네트워크 공통 설정 |
| **`/etc/sysconfig/network-scripts/`** | `ifcfg-enp0s3` 같은 **인터페이스별 설정 파일**이 들어 있는 디렉터리 | 네트워크 인터페이스 환경 설정 |
| **`/etc/services`** | 서비스 이름과 **포트 번호/프로토콜** 대응표 | 프로토콜과 관련된 포트 번호 확인 |

가상 도메인 설정 예입니다.

```
# cat >> /etc/hosts
192.168.56.102   www.ihd.or.kr
```

> **함정** 파일 이름 철자를 바꾼 보기가 자주 나옵니다. `/etc/protocol`, `/etc/service`는 없는 파일이고, 맞는 이름은 **`/etc/services`**(끝에 s)입니다. 같은 이유로 `/etc/protocols`는 포트 번호표가 아니라 프로토콜 번호표입니다.

> **함정** `/etc/hosts`는 `IP  이름` 한 줄씩이고, `/etc/resolv.conf`는 `nameserver 주소` 형식입니다. 파일 내용이 보기로 주어지면 첫 단어로 구분합니다. `127.0.0.1 localhost`로 시작하면 hosts, `nameserver`로 시작하면 resolv.conf입니다.

## 2. 인터페이스 장치명

CentOS 7은 장치명을 하드웨어 위치로 정하는 **예측 가능한 이름** 방식을 씁니다. 이더넷 카드는 `enp0s3`처럼 나타납니다. 예전 방식 `eth0`, 루프백 `lo`, 가상 브리지 `virbr0`은 이더넷 카드를 장착했을 때의 일반 형식이 아닙니다.

## 3. 명령 비교

| 하려는 일 | 명령 |
|---|---|
| 인터페이스 **물리적 연결(링크) 확인** | **`ethtool 장치`**, `mii-tool` |
| 링크 모드를 Auto-negotiation에서 1000Mb/s Full duplex로 변경 | **`ethtool`** (`-s` 옵션으로 speed, duplex 지정) |
| **이웃 호스트의 MAC 주소** 조회 | **`arp`** |
| 시스템에 장착된 카드의 MAC 주소 확인 | `ip`(`ip link`), `ifconfig` |
| **게이트웨이 주소, 라우팅 테이블** 확인 | `route`, `ip route show`, `netstat -r` |
| 인터페이스 켜기/끄기 | `ifconfig eth0 up` / `ifconfig eth0 down` |
| 연결 상태(ESTABLISHED), SYN Flooding 점검 | **`ss`**, **`netstat`** |
| 특정 서버의 포트가 열려 있는지 점검 | `telnet IP 포트` |

### 명령 상세

```
# route add default gw 192.168.10.1       ← 기본 게이트웨이 설정
# route                                    ← 라우팅 테이블, 게이트웨이 확인
# ip route show                            ← 라우팅 테이블 (ip gw show, ip gateway show는 없는 형식)
# netstat -r                               ← 라우팅 테이블
# telnet 192.168.12.22 443                 ← HTTPS 포트 점검 (IP와 포트를 공백으로 구분)
# ss -a                                    ← 소켓의 모든 정보
```

| 도구 | 옵션 | 뜻 |
|---|---|---|
| `netstat` | `-r` | 라우팅 테이블 출력 |
| `netstat` | `-n` | 이름 변환 없이 숫자로 출력 |
| `netstat` | `-t` | TCP만 |
| `ss` | `-a` | **모든 소켓** 정보 |
| `ss` | `-n` | 숫자로 출력 |
| `ss` | `-t` | TCP만 |
| `ss` | `-o` | 타이머 정보 |

`ss`는 `netstat`의 후속 도구로 더 빠르게 소켓 정보를 보여 줍니다.

> **함정** `telnet`으로 포트를 점검할 때는 **`telnet 192.168.12.22 443`**처럼 포트를 **공백으로** 뒤에 붙입니다. `IP:포트`나 `-p` 옵션은 형식이 틀립니다. HTTPS는 443, HTTP는 80입니다.

> **함정** 게이트웨이 설정 명령은 **`route add default gw 주소`**입니다. `default -gw`, `add net`처럼 하이픈이나 키워드 하나를 바꾼 보기가 함정입니다.

> **함정** 라우팅 테이블 확인은 `route`, `ip route`, `netstat -r`입니다. `ethtool`은 게이트웨이와 무관하므로 "게이트웨이를 확인하는 명령으로 **틀린 것**"의 정답이 됩니다. `ipconfig`는 리눅스 명령이 아니라 윈도 명령입니다.

## 4. netstat 상태값

| State | 뜻 |
|---|---|
| **LISTEN** | 연결 요청을 기다리는 상태 |
| **SYN_SENT** | 클라이언트가 SYN을 보내고 응답을 기다림 |
| **SYN_RECV** | 서버가 SYN을 받고 SYN/ACK를 보낸 상태. SYN Flooding 공격이 쌓이는 곳 |
| **ESTABLISHED** | **3Way-Handshaking이 완료**되어 서버와 클라이언트가 연결된 상태 |

## 5. 시험 직전 점검

> - 네임 서버 → `/etc/resolv.conf`, 가상 도메인 → `/etc/hosts`, 포트 번호 → `/etc/services`.
> - 호스트명·게이트웨이 → `/etc/sysconfig/network`, 인터페이스별 → `/etc/sysconfig/network-scripts`.
> - 케이블 연결 확인 → `ethtool`, `mii-tool`. MAC 조회 → `arp`.
> - 게이트웨이 확인 → `route`, `ip route show`, `netstat -r`.
> - ESTABLISHED, SYN Flooding → `ss`, `netstat`.
> - CentOS 7 장치명 → `enp0s3`.

## 6. OX 점검

| 문장 | 답 | 이유 |
|---|---|---|
| DNS 서버 주소는 `/etc/hosts`에 적는다. | X | `/etc/resolv.conf`입니다. |
| `ethtool`로 케이블 연결 여부를 확인할 수 있다. | O | `mii-tool`도 가능합니다. |
| `arp`는 이웃 호스트의 MAC 주소를 조회한다. | O | |
| `telnet 192.168.12.22:443`으로 포트를 점검한다. | X | 포트는 공백으로 붙입니다. |
| `ifconfig eth0 down`은 eth0을 중지한다. | O | |
| `ethtool`은 게이트웨이 주소를 확인하는 명령이다. | X | 링크 상태와 속도를 다룹니다. |
| `ss -a`는 모든 소켓 정보를 출력한다. | O | |
| `ESTABLISHED`는 연결 요청을 기다리는 상태이다. | X | 연결 요청 대기는 `LISTEN`입니다. |
