# TCP·UDP·포트

<div class="summary">

- **TCP**는 연결형, 신뢰성, **슬라이딩 윈도우 흐름 제어**, 3-way handshake를 씁니다. **UDP**는 비연결형, 순서·재조립·확인 응답이 없고 헤더가 단순합니다.
- **3-way handshake**는 `SYN` → `SYN, ACK` → `ACK`입니다. 정상 종료는 **`FIN`**, 강제 종료는 `RST`입니다.
- **UDP 헤더**는 출발지 포트, 목적지 포트, 길이, 체크섬뿐입니다. Window, Sequence, Acknowledgment 번호는 없습니다.
- 데이터 단위: 데이터링크 **프레임**, 네트워크 **패킷(데이터그램)**, 전송 **세그먼트**.
- **포트**: SMTP 25, FTP 제어 21과 데이터 20, **DNS는 TCP와 UDP 둘 다 53**.

</div>

## 1. TCP/IP 4계층과 데이터 단위

하위에서 상위로 **Network Interface - Internet - Transport - Application** 순입니다.

| 계층 | 대표 프로토콜 | 데이터 단위 |
|---|---|---|
| Network Interface | 이더넷 | **프레임** |
| Internet | IP, ICMP, ARP | 패킷, 데이터그램 |
| Transport | TCP, UDP | 세그먼트 |
| Application | HTTP, SMTP, FTP, DNS | 메시지 |

## 2. TCP

| 항목 | 내용 |
|---|---|
| 방식 | **연결 위주**, 신뢰성 있는 전송, 종단 간 **흐름 제어**(동적 **Sliding Window**), 에러 제어 |
| 연결 | Three Way Handshaking |
| 적합한 곳 | 데이터를 잃으면 안 되는 서비스 |
| 부적합한 곳 | 화상 통신 같은 **실시간 통신**, 일부 손실이 치명적이지 않은 프로그램 (UDP가 적합) |

> **함정** TCP는 "일부 데이터가 손실되어도 치명적이지 않은 프로그램에 적합"하지 않습니다. 이것은 UDP의 특성입니다. 흐름 제어 방식은 Sliding Window이고 Go-Back-N, 선택적 재전송(Selective Repeat), Stop-and-Wait(Idle-RQ)는 오류 제어·ARQ 방식으로 TCP의 흐름 제어 방식이 아닙니다.

### TCP 헤더 필드

| 필드 | 크기와 역할 |
|---|---|
| Source Port | **16비트** |
| Destination Port | 16비트 |
| Sequence Number | **32비트** |
| Acknowledgment Number | 32비트 |
| Flags | 9비트 (제어 비트) |
| Window | 흐름 제어 |
| **Checksum** | **16비트**, **에러 제어** 필드 |

> **함정** Checksum을 32비트라고 하면 틀립니다. 16비트입니다.

### 플래그

| 플래그 | 의미 |
|---|---|
| **SYN** | 세션 성립 **요청** (3-way handshake 1단계) |
| **SYN, ACK** | 요청 수락 (2단계) |
| **ACK** | 확인 응답 (3단계) |
| **FIN** | 연결이 **정상적으로 끝남** |
| **RST** | 연결을 **강제로** 끊음 |
| URG | 긴급 데이터 |

`UTC`는 TCP 플래그가 아닙니다.

### 3-way handshake와 상태

| 단계 | 방향 | 플래그 | 상태 변화 |
|---|---|---|---|
| 1 | 클라이언트 → 서버 | SYN | 클라이언트 `SYN_SENT` |
| 2 | 서버 → 클라이언트 | SYN, ACK | 서버 **`LISTEN` → `SYN_RECEIVED`** |
| 3 | 클라이언트 → 서버 | **ACK** | 양쪽 `ESTABLISHED` |

## 3. UDP

| 항목 | 내용 |
|---|---|
| 방식 | **비연결형** 데이터 전달, TCP에 비해 신뢰성이 낮음 |
| 단위 | **사용자 데이터그램**을 송신지 응용 프로세스에서 수신지 응용 프로세스로 전송 |
| 제공하지 않는 것 | 메시지를 패킷으로 나눴다 **재조립**하는 서비스, **순서 보장**, 확인 응답 |
| 헤더 | Source Port, Destination Port, Length, **Checksum** |
| 계층 | 전송 계층, IP를 이용해 데이터그램을 전달 |

> **함정** UDP 헤더에 **Window**, **Acknowledgment Number**는 없습니다. UDP가 제공하는 오류 검사는 체크섬이며 "홀수/짝수 패리티"는 UDP의 기능이 아닙니다.

> **함정** **FTP**는 TCP를 쓰는 프로토콜입니다. "FTP가 UDP를 사용하는 대표 프로토콜"이라는 설명은 틀립니다.

## 4. 전송 방식

| 방식 | 의미 |
|---|---|
| **Unicast** | 한 호스트에서 **다른 한 호스트**로 |
| **Multicast** | 한 호스트에서 **특정 그룹** 호스트들로 |
| **Broadcast** | 한 호스트에서 망상의 **모든 호스트**로 |

## 5. 포트와 서비스

| 프로토콜 | 포트 | 비고 |
|---|---|---|
| **SMTP** | **25** | 메일 송신. 110은 POP3, 23은 Telnet, 443은 HTTPS |
| **FTP** | 20(데이터), 21(제어) | **연결 제어와 정보 전송용 포트를 구분**해서 사용 |
| **DNS** | 53 | **TCP와 UDP 포트를 함께** 사용 |
| TFTP | 69 | UDP |

> **함정** FTP는 제어와 데이터 포트를 나누는 대표 프로토콜이고, DNS는 TCP와 UDP를 모두 쓰는 대표 프로토콜입니다. SMTP, FTP, Telnet은 TCP 기반입니다.

## 6. 관련 개념

**L4 스위치**: TCP/UDP **포트**를 기반으로 트래픽을 보고 다중 서버로 부하를 분산(**Load Balancing**)합니다. L1은 물리, L2는 MAC 주소, L3는 IP 주소 기반입니다.

**OSPF**(Open Shortest Path First)

| 사실 | 내용 |
|---|---|
| 종류 | AS 내부 경로 정보 교환에 쓰는 **링크 스테이트** 라우팅 프로토콜 |
| 이웃 확인 | **Hello 패킷**으로 이웃 라우터의 정상 동작 확인 |
| 경로 | 비용이 같은 여러 경로를 쓸 수 있음 (최저 비용 단일 경로만 사용하는 것은 아님) |
| 버전 | IP 버전에 따라 다름 (IPv4는 OSPFv2, IPv6는 OSPFv3) |

## 7. 시험 직전 점검

> - 흐름 제어는 Sliding Window. 3-way는 SYN, SYN+ACK, ACK.
> - 서버는 SYN을 받으면 `LISTEN`에서 `SYN_RECEIVED`로 바뀜.
> - 정상 종료 FIN, 강제 종료 RST. TCP 플래그에 UTC는 없음.
> - UDP 헤더에 Window와 Acknowledgment 번호는 없음. TCP Checksum은 16비트.
> - 데이터링크 단위 프레임, 전송 계층 단위 세그먼트.
> - DNS는 TCP/UDP 둘 다, FTP는 포트 20/21 분리, SMTP는 25.

## 8. OX 점검

| 문장 | 답 | 이유 |
|---|---|---|
| TCP는 화상 통신 같은 실시간 통신에 적합하다. | X | UDP가 적합합니다. |
| UDP 헤더에는 Window 필드가 있다. | X | TCP 헤더 필드입니다. |
| 연결이 정상적으로 끝났음을 알리는 플래그는 FIN이다. | O | RST는 강제 종료입니다. |
| 서버는 SYN을 받으면 ESTABLISHED가 된다. | X | `SYN_RECEIVED`가 됩니다. |
| TCP 체크섬은 32비트이다. | X | 16비트입니다. |
| DNS는 TCP와 UDP 포트를 모두 사용한다. | O | |
| 데이터링크 계층의 데이터 단위는 세그먼트이다. | X | 프레임입니다. |
| L4 스위치는 TCP/UDP 포트를 보고 부하를 분산할 수 있다. | O | |
