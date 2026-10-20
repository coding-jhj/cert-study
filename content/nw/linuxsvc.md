# 리눅스 서버 서비스 (Apache·BIND·FTP·SSH·iptables)

<div class="summary">

- **Apache(`httpd.conf`)**: 포트 변경은 **`Listen`**, 접속 후 요청이 없을 때 끊는 시간은 **`KeepAliveTimeout`**, POST 크기 제한은 **`LimitRequestBody`**. **`Options ... Indexes`** 는 디렉터리 리스팅 공격에 취약합니다.
- **BIND(`/etc/named.conf`)**: zone 파일 위치는 `directory`, 설정 오류 검사는 `named-checkconf`, DNS 서버 주소 파일은 `/etc/resolv.conf`.
- **FTP**: **20번 = 데이터, 21번 = 제어(인증과 명령)**. **Passive Mode**는 서버가 임의의 데이터 포트를 알려 주고 클라이언트가 그 포트로 접속합니다.
- **iptables**: 외부에서 들어오는 Telnet 차단 = `iptables -A INPUT -p tcp --dport 23 -j DROP`.
- **Round Robin**: 같은 도메인에 대해 DNS가 서버 IP를 순서대로 돌려 부하를 분산합니다.

</div>

## 1. Apache 웹 서버

설정 파일은 **`httpd.conf`** 입니다. 디렉터리 리스팅 방지, 심볼릭 링크 사용 방지, SSI 제한, CGI 실행 디렉터리 제한 같은 보안 설정을 합니다(`httpd-default.conf`, `httpd-vhosts.conf`, `httpd-mpm.conf`는 아님).

| 지시자 | 기능 |
|---|---|
| **`Listen 8081`** | 서비스 **포트 번호** 지정 (`Port`, `Default Port`, `Listening`은 올바른 지시자가 아님) |
| **`KeepAliveTimeout 80`** | 접속 후 **80초간 요청이 없으면 연결 종료** |
| `KeepAlive On` | KeepAlive 사용 |
| `Timeout` | 요청 처리 제한 시간 |
| `MaxKeepAliveRequests` | 한 연결당 최대 요청 수 |
| **`LimitRequestBody`** | POST 요청 본문이 **일정 크기를 넘지 못하게** 제한 |
| `DocumentRoot` | 웹 문서 루트 (`/var/www/html`) |
| `ServerRoot` | 서버 설치 경로 (`/etc/httpd`) |
| `StartServers` | 시작할 서버 프로세스 수 |
| **`Options FollowSymLinks Indexes`** | **`Indexes`** 가 디렉터리 내용을 노출해 **Directory Indexing 공격**에 취약 |

> **함정** `Exec-timeout`은 네트워크 장비 설정이고, `Listen 80`은 포트 지정이며 시간 제한이 아닙니다. 지시자 이름이 비슷한 가짜(`KeepRequestSize`, `RestrictBodyRequest`, `PostRequestSize`)에 속지 않습니다.

### Well-known 포트로 실행할 때의 주의

- Well-known 포트는 **1부터 1023까지**이며 실행하려면 **관리자 권한**이 필요합니다.
- 포트를 바꿀 때는 다른 서비스와 **충돌하지 않는 번호**를 씁니다.
- 일반 사용자 계정에서 실행할 때 명령 앞에 `su`를 붙이는 것은 올바른 방법이 아닙니다(관리자 권한이 필요하다는 뜻이지 `su`를 붙이라는 뜻이 아님).

## 2. BIND(DNS 서버)

```
options {
  listen-on port 53 { any; };       ← 53번 포트에 대해 외부 접근을 허용
  directory "/var/named";           ← zone 파일 위치
  allow-query { any; };             ← 모든 IP 대역의 query 허용
  masterfile-format text;           ← zone 파일을 text 형태로
};
```

| 지시자 | 의미 |
|---|---|
| `listen-on port 53 { any; }` | 53번 포트에서 **외부 접근 허용** |
| **`directory "/var/named"`** | **zone 파일 위치** |
| `dump-file` | 캐시 덤프 파일 |
| `allow-query { 192.168.0.0/24; }` | 질의를 허용할 대역 |
| `allow-query { any; }` | **외부에서 오는 모든 IP 대역** 허용 |
| `masterfile-format text` | zone 파일을 text 형태로 (slave 동기화 시 text 형태로 변환) |

| 업무 | 방법 |
|---|---|
| 설치 여부 확인 | `rpm -qa | grep bind` |
| 설정 파일 오류 검사 | **`named-checkconf`** |
| 방화벽 설정 | `iptables` 명령 |
| 방화벽 포트 | **UDP 53만 열면 되는 것이 아니라 TCP 53도 필요** (DNS는 TCP와 UDP를 모두 사용) |
| DNS 서버 주소 설정 | **`/etc/resolv.conf`** (`nameserver 127.0.0.1` 형식) |

`/etc/networks`, `/etc/protocols`, `/etc/services`는 DNS 서버 주소가 들어 있는 파일이 아닙니다.

## 3. FTP

| 포트 | 역할 |
|---|---|
| **20번** | **데이터 전송** |
| **21번** | **사용자 인증과 명령 제어** |

> **함정** 22번은 SSH, 23번은 Telnet입니다. "20번 제어, 21번 데이터"처럼 뒤바뀐 보기와 1024번이 섞인 보기에 주의합니다.

| 모드 | 설명 |
|---|---|
| Active | 서버가 클라이언트로 데이터 연결을 시도 |
| **Passive** | 서버에서 **따로 포트 대역을 설정**하고, 서버가 **임의로 지정한 데이터 포트 정보를 클라이언트에 보내** 클라이언트가 그 포트로 접속 |

## 4. SSH

원격지 호스트에 접속하는 응용 프로그램이자 프로토콜로, Well-known 포트는 **22번**입니다. FTP와 Telnet이 사용자 입력을 **평문**으로 전송하는 것을 보완하는 보안 프로토콜입니다. 보안 이슈로 포트 번호를 바꿔 쓰기도 합니다. SSL과 TLS는 전송 계층 보안 프로토콜이고 RDP는 윈도 원격 데스크톱입니다.

## 5. iptables

```
# iptables -A INPUT -p tcp --dport 23 -j DROP
```

| 구성 | 의미 |
|---|---|
| `-A INPUT` | **들어오는**(외부에서 오는) 패킷 규칙 추가 |
| `-p tcp` | TCP 프로토콜 |
| `--dport 23` | 목적지 포트 23 (**Telnet**) |
| `-j DROP` | 패킷을 버림 |

> **함정** OUTPUT은 나가는 패킷, 21번은 FTP, UDP 23은 Telnet의 프로토콜(TCP)이 아닙니다. 외부에서 들어오는 Telnet을 막는 것은 `INPUT`, `tcp`, `23` 세 가지가 모두 맞아야 합니다.

## 6. 부하분산: Round Robin

여러 대의 웹 서버를 운영하며 동일한 도메인으로 접속하면 DNS 서버가 **각기 다른 IP를 순차적으로** 응답해 부하를 나눕니다(예: `10.10.10.1` → `10.10.10.2` → `10.10.10.3`). 클라이언트 요청이 오면 **교대로** 서비스를 실행합니다.

| 방식 | 설명 |
|---|---|
| **Round Robin** | 순서대로 돌아가며 응답 |
| Least Connection | 연결 수가 가장 적은 서버로 |
| IP Hash | 클라이언트 IP 해시로 서버 결정 |
| Least Response Time | 응답이 가장 빠른 서버로 |
| Heartbeat, Failover Cluster | 장애 감지와 장애 조치 |
| Non-Repudiation | 부인 방지(보안 속성) |

## 7. 시험 직전 점검

> - 포트 변경 `Listen`, 유휴 종료 `KeepAliveTimeout`, POST 제한 `LimitRequestBody`.
> - `Options ... Indexes`는 디렉터리 리스팅에 취약.
> - 네임서버 주소는 `/etc/resolv.conf`, zone 파일 위치는 `directory`, 설정 검사는 `named-checkconf`.
> - FTP 20 데이터, 21 제어. Passive는 서버가 포트를 알려 줌.
> - 외부 Telnet 차단은 INPUT, tcp, 23, DROP.
> - DNS가 IP를 순서대로 돌려주면 Round Robin.

## 8. OX 점검

| 문장 | 답 | 이유 |
|---|---|---|
| Apache 포트 변경은 `Listen`으로 한다. | O | |
| `KeepAliveTimeout`은 POST 크기를 제한한다. | X | 유휴 연결 종료 시간입니다. 크기 제한은 `LimitRequestBody`. |
| `Options Indexes`는 디렉터리 리스팅 공격에 취약하다. | O | |
| BIND는 방화벽에서 UDP 53만 열면 된다. | X | TCP 53도 필요합니다. |
| FTP는 21번 포트로 데이터를 전송한다. | X | 21은 제어, 20은 데이터입니다. |
| Passive 모드에서는 서버가 데이터 포트를 클라이언트에 알려 준다. | O | |
| `iptables -A OUTPUT -p tcp --dport 23 -j DROP`은 외부에서 오는 Telnet을 막는다. | X | OUTPUT은 나가는 패킷입니다. |
| 일반 사용자는 명령 앞에 `su`를 붙이면 Well-known 포트를 쓸 수 있다. | X | 관리자 권한이 필요하다는 뜻입니다. |
