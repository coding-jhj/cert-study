# 패키지와 소스 설치

<div class="summary">

- **배포판 계열**: 레드햇 계열은 `rpm`·`yum`·`dnf`, 데비안 계열은 `dpkg`·`apt-get`·`dselect`·`alien`, SUSE는 `zypper`·`YaST`입니다.
- **rpm** 옵션은 `-i`(설치), `-U`(업그레이드·설치), `-e`(제거), `-q`(조회)이고, 조회는 `-qa`(전체), `-qi`(정보), `-ql`(파일 목록), `-qf`(파일이 속한 패키지), `-qip`(받은 rpm 파일의 정보)입니다.
- **tar**는 `c`(묶기), `x`(풀기), `t`(목록), `r`(추가)에 `-z`(gzip), `-j`(bzip2), `-J`(xz)를 곁들입니다.
- **소스 설치**는 `configure` → `make` → `make install` 순서이고, `configure`가 `Makefile`을 만듭니다.

</div>

## 1. 배포판 계열과 패키지 도구

| 계열 | 패키지 파일 | 저수준 도구 | 온라인 도구 |
|---|---|---|---|
| 레드햇(RHEL, CentOS, Fedora) | `.rpm` | `rpm` | `yum`, `dnf` |
| 데비안(Debian, Ubuntu) | `.deb` | `dpkg` | `apt-get`, `apt` |
| SUSE | `.rpm` | `rpm` | `zypper`, `YaST` |

- **저수준 도구**(`rpm`, `dpkg`)는 내려받은 패키지 파일 하나를 설치·제거합니다. 필요한 다른 패키지(의존성)를 자동으로 받아 주지 않습니다.
- **온라인 도구**(`yum`, `dnf`, `apt-get`, `zypper`)는 저장소에서 패키지를 내려받고 의존성까지 처리합니다. 그래서 문제에서 "온라인 패키지 관리 도구가 아닌 것"을 묻는 답은 `rpm`, `dpkg`, 그리고 `YaST`(SUSE의 설정 도구)입니다.
- `dselect`는 데비안의 curses 메뉴 방식 패키지 도구이고, `alien`은 rpm 파일을 deb 파일로 **변환**합니다. `pacman`은 아치 리눅스 계열이라 레드햇과 무관합니다.

## 2. rpm

```
# rpm -U sendmail-8.14.7-6.el7.x86_64.rpm      # 설치(이미 있으면 업그레이드)
# rpm -e sendmail                              # 제거
# rpm -e httpd --nodeps                        # 의존성 검사를 무시하고 제거
# rpm -q sendmail                              # 설치 여부 확인
# rpm -qa | grep httpd                         # 전체 목록에서 검색
# rpm -ql vsftpd                               # 패키지에 들어 있는 파일 목록
# rpm -qf /bin/ls                              # 이 파일이 속한 패키지
# rpm -qip totem-3.26.2-1.el7.x86_64.rpm       # 받은 rpm 파일의 정보(p = 파일)
```

| 옵션 | 의미 |
|---|---|
| `-i` | 설치 |
| `-U` | 업그레이드(없으면 설치) |
| `-F` | 이미 설치된 것만 업그레이드 |
| `-e` | 제거(erase). `-r`, `-d`는 제거 옵션이 아님 |
| `-V` | 검증(verify) |
| `-q` | 조회(query). 뒤에 `a`, `i`, `l`, `f`, `p` 조합 |

> **함정** `-qi`는 **설치된** 패키지의 정보, `-qip 파일명`은 **내려받은 rpm 파일**의 정보입니다. 설치하지 않은 패키지의 정보를 yum으로 보려면 `yum info`입니다. `-f`는 설치 옵션이 아니라 `-qf`처럼 조회에 쓰입니다.

## 3. yum

| 명령 | 하는 일 |
|---|---|
| `yum install 패키지` | 설치 (`-y`는 질문에 자동으로 yes) |
| `yum remove 패키지` | 제거 (`delete`, `destroy`는 없음) |
| `yum search 문자열` | 이름·설명에 문자열이 **들어 있는** 패키지 검색 |
| `yum info 패키지` | 패키지 정보(**설치하지 않은 것도** 가능) |
| `yum list` | 패키지 목록 |
| `yum history` | 작업 이력 목록 |
| `yum install epel-release` | 확장 패키지 저장소(EPEL) 등록 |

`yum search telnet`처럼 문자열만 씁니다(`*`, `^`, `?` 같은 기호를 붙이지 않습니다).

## 4. dpkg와 apt-get (데비안 계열)

| 명령 | 하는 일 |
|---|---|
| `dpkg -i 파일.deb` | 설치 (`dpkg -i vim_4.5-3.deb`) |
| `dpkg -r 패키지` | 제거 |
| `dpkg -l` | 설치된 패키지 **목록**(소문자 L) |
| `dpkg -L 패키지` | 패키지의 파일 목록(대문자 L) |
| `apt-get remove 패키지` | 제거(설정 파일은 남김) |
| `apt-get purge 패키지` | **설정 파일까지** 제거 |

## 5. tar와 압축

| 옵션 | 의미 |
|---|---|
| `c` | 묶기(create) |
| `x` | 풀기(extract) |
| `t` | **내용 목록** 확인(list) |
| `r` | 묶인 파일에 **추가**(append) |
| `v` | 과정 출력 |
| `f` | 파일 이름 지정(항상 맨 뒤 옵션) |
| `-C 디렉터리` | **풀 위치** 지정 (`tar xvf backup.tar -C /usr/local/src`) |
| `z` | gzip (`.gz`) |
| `j` | bzip2 (`.bz2`) |
| `J` | xz (`.xz`) |

```
# tar cvf source.tar *.c            # 현재 디렉터리의 C 파일을 묶기 (묶음 이름이 먼저)
# tar rvf backup.tar lin.txt joon.c # 이미 묶인 파일에 추가
# tar tvf backup.tar                # 내용만 확인
# tar zxvf mysql.tar.gz             # gzip 압축을 풀기
# tar jxvf httpd.tar.bz2            # bzip2
# tar Jxvf linux.tar.xz             # xz (대문자 J)
# tar jtvf php.tar.bz2              # bzip2 파일의 내용만 확인
```

| 확장자 | 도구 | 압축률 |
|---|---|---|
| `.Z` | `compress` | 낮음 |
| `.gz` | `gzip` | 보통 |
| `.bz2` | `bzip2` | 높음 |
| `.xz` | `xz` | **가장 높음** |

압축 효율은 **xz > bzip2 > gzip** 순서이고 파일 크기는 반대입니다. 용량이 가장 작은 파일은 `.xz`입니다. 소문자 `z`·`j`와 대문자 `J`, `Z`가 서로 다른 압축을 가리키는 점에 유의합니다.

## 6. 소스 코드로 설치

내려받은 소스(`httpd-2.4.46.tar.bz2` 등)를 푼 디렉터리에서 다음 세 단계를 순서대로 합니다.

| 순서 | 명령 | 하는 일 |
|---|---|---|
| 1 | `./configure` | 환경을 점검하고 **`Makefile`을 생성** |
| 2 | `make` | `Makefile`을 읽어 타깃과 의존성에 따라 **컴파일** |
| 3 | `make install` | 컴파일한 결과를 설치 |

```
# ./configure --help                        # 지원하는 설치 옵션 확인
# ./configure --prefix=/usr/local/apache    # 설치 위치 지정
# make
# make install
# make clean                                # 컴파일로 생긴 파일을 지우고 처음부터 다시
```

- `./configure --help`로 옵션을 확인합니다(`--config`, `--option`은 없습니다).
- `configure` 후에 생기는 파일은 **`Makefile`**입니다(`.config`가 아닙니다).
- `make clean`은 이전 작업의 결과물을 지웁니다. 그 뒤에 다시 설정과 컴파일을 합니다.
- **cmake**는 `make`를 대신해 여러 플랫폼을 지원하려고 나온 도구입니다. **MySQL, KDE, LMMS**는 cmake로 설치하고, **PHP, Apache httpd, Nmap**은 `configure` 방식입니다.

## 7. 시험 직전 점검

> - 소스 설치 순서는 configure → make → make install입니다.
> - `rpm -qip 파일명`은 내려받은 rpm 파일의 정보, `yum info`는 미설치 패키지 정보입니다.
> - `tar`의 `t`는 목록, `x`는 풀기, `r`은 추가이고 `-C`는 풀 위치입니다.
> - 압축률은 xz가 가장 높고, tar에서는 대문자 `J`입니다.
> - rpm, dpkg는 저수준 도구이고 yum, dnf, apt-get, zypper는 온라인 도구입니다.

## 8. OX 점검

| 문장 | 답 | 이유 |
|---|---|---|
| `yum delete 패키지`로 패키지를 제거한다. | X | `yum remove`입니다. |
| `rpm -U`는 이미 설치된 패키지를 업그레이드하고 없으면 설치한다. | O | |
| `tar xvf`의 `x`는 묶인 파일의 목록을 확인한다. | X | `x`는 풀기이고 목록은 `t`입니다. |
| `.xz`는 `.gz`보다 압축률이 높다. | O | |
| `configure` 실행 후 `.config` 파일이 생긴다. | X | `Makefile`이 생깁니다. |
| `apt-get purge`는 설정 파일까지 제거한다. | O | |
| `dpkg -l`은 설치된 패키지 목록을 보여 준다. | O | 소문자 L입니다. |
| PHP는 cmake로 설치한다. | X | `configure` 방식입니다. |
