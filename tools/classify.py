"""Assign every question to one study chapter by keyword score (within its subject).
Writes content/chapter-map.json {questionId: chapterId}. Prints counts and low-confidence cases."""
import glob
import json
import re
import sys
from collections import Counter

R = {
    "lm": {
        1: {
            "lm-shell": r"셸|셀|bash|csh|ksh|dash|환경\s?변수|PS1|PS2|alias|에일리어스|history|히스토리|\.bash|/etc/profile|/etc/shells|chsh|\$SHELL|\$USER|export|unset|\benv\b|\bset\b|!!|!\?|\$MAIL|\$LANG|\$TERM|TMOUT|HISTSIZE|명령행 완성|\[Tab\]",
            "lm-perm": r"chmod|chown|chgrp|umask|Set-UID|Set-GID|Sticky|허가권|권한|소유권|소유자|ls -l|ls -ld|rwx|---",
            "lm-disk": r"fdisk|mount|fstab|mtab|\bdf\b|\bdu\b|quota|쿼터|LVM|RAID|파티션|UUID|blkid|lsblk|fsck|xfs|ext4|ext3|mkfs|mke2fs|마운트|\bPV\b|\bVG\b|\bLV\b|\bPE\b|디스크|swap|스왑|볼륨|하드디스크|/dev/sd",
            "lm-proc": r"프로세스|fork|exec|시그널|SIG|\bkill|nice|cron|jobs|\bbg\b|\bfg\b|nohup|\bps\b|\btop\b|pstree|daemon|데몬|inetd|standalone|\bPID\b|\bNI\b|\bPRI\b|포어그라운드|백그라운드|systemd|STAT|좀비|\[Ctrl\]\+\[[zc]\]",
            "lm-pkg": r"rpm|yum|dnf|dpkg|apt|zypper|YaST|\btar\b|소스|configure|\bmake\b|cmake|압축|gzip|bzip2|\bxz\b|패키지|alien|dselect|compress|epel|저장소",
            "lm-editor": r"\bvi\b|\bvim\b|nano|emacs|pico|gedit|kwrite|ex 모드|치환|편집기|:% ?s|\.vimrc|\.exrc|set nu|set ai",
            "lm-print": r"\blp\b|lpr|lpq|lpc|lprm|lpstat|lpadmin|cancel|프린|CUPS|LPRng|사운드|ALSA|OSS|SANE|스캐너|alsactl|인쇄",
        },
        2: {
            "lm-xwin": r"X 윈도|X Window|X 서버|X 클라이언트|윈도 매니저|데스크톱|GNOME|그놈|KDE|DISPLAY|xhost|xauth|Xlib|XCB|GTK|\bQt\b|startx|Wayland|LibreOffice|뷰어|Eog|Gimp|Totem|evince|graphical|Metacity|Mutter|Kwin|Xfce|LXDE|디스플레이 매니저|xrandr|Xsession|Xauthority|xset|ImageMagick",
            "lm-net": r"IP 주소|서브넷|게이트웨이|ifconfig|netstat|\bss\b|\broute\b|\barp\b|ping|ethtool|resolv|/etc/hosts|OSI|TCP|UDP|포트|브로드캐스트|IPv|클래스|LAN|토폴로지|스타형|링형|버스형|망형|DNS|ICANN|IEEE|케이블|MAC|네트워크|프로토콜|SYN|\bip\b|mii-tool|도메인|\bWAN\b|\bMAN\b|\bSAN\b|CSMA|FDDI|X\.25|패킷|handshak|UTP|STP|BNC",
            "lm-netcmd": r"ifconfig|netstat|ss|route|arp|ping|ethtool|resolv|/etc/hosts|/etc/sysconfig|network-scripts|mii-tool|ip (route|addr|link|gw|add)|게이트웨이 주소|nameserver|traceroute|nslookup|hostname|명령어로|MAC 주소를 (확인|조회)|물리적 연결|물리적 케이블|SYN Flooding|가상 도메인|hosts 파일",
            "lm-svc": r"\bssh\b|sftp|\bftp\b|FTP|telnet|samba|SAMBA|\bNFS\b|SMTP|POP3|IMAP|\bIRC\b|Usenet|웹 브라우저|firefox|파이어폭스|크롬|\bput\b|\bget\b|\bhash\b|vsftpd|lynx|links|Gopher|\bNIS\b|rsh|scp|서비스",
            "lm-virt": r"가상화|KVM|Xen|VirtualBox|컨테이너|Docker|Kubernetes|Ansible|OpenStack|클러스터|클라우드|IaaS|PaaS|SaaS|임베디드|아두이노|Arduino|라즈베리|Raspberry|빅데이터|Hadoop|NoSQL|webOS|Tizen|Android|모바일|QNX|GENIVI|IVI|Cassandra|Hyper-V|HPC|HA\b|고가용성|부하분산|베어울프",
        },
    },
    "nw": {
        1: {
            "nw-ip": r"IP 주소|IP주소|서브넷|서브네팅|클래스|class|MTU|단편화|Offset|DF Flag|브로드캐스트|\d+\.\d+\.\d+\.\d+|IPv4|사설|공인|네트워크 주소|호스트 수",
            "nw-tcpudp": r"TCP|UDP|포트|port|handshak|SYN|ACK|RST|FIN|세그먼트|윈도우|플래그",
            "nw-proto": r"ICMP|ARP|DNS|DHCP|SNMP|FTP|SMTP|HTTP|TFTP|Telnet|SSH|IGMP|NTP|프로토콜|IMAP|POP3|NAT",
            "nw-ipv6": r"IPv6|128비트|128bit|::|Dual Stack|터널링|Tunneling",
        },
        2: {
            "nw-osi": r"OSI|계층|ARQ|오류|흐름|프레임|다중화|부호화|PDU|캡슐화|전송 방식|동기|변조|PCM|채널|Go-back|Stop-and-Wait",
            "nw-lan": r"LAN|토폴로지|성형|링|버스|이더넷|Ethernet|케이블|MAC|CSMA|패킷 교환|회선 교환|스위칭|Star|Ring|Mesh|메시|WAN|MAN|VPN|가상회선|데이터그램",
            "nw-wireless": r"무선|WPAN|블루투스|Bluetooth|5G|Wi-Fi|와이파이|셀|이동|ZigBee|RFID|UWB|NFC|애드 혹|Ad hoc|802\.11|LTE|MIMO|핸드오프",
            "nw-cloud": r"클라우드|SDN|NFV|가상화|엣지|Edge|포그|Fog|사물인터넷|IoT|SaaS|PaaS|IaaS|public|private|hybrid|VNF|Cloud",
        },
        3: {
            "nw-win": r"Windows|PowerShell|Active Directory|AD\b|IIS|Hyper-V|그룹 ?정책|도메인 컨트롤러|DHCP 범위|netstat|ipconfig|nslookup|tracert|pathping|\bOU\b|트러스트|포리스트|NTFS|Server 20",
            "nw-linux": r"Linux|리눅스|/etc|chmod|chown|ps -|crontab|runlevel|passwd|shadow|디렉터리|명령어|useradd|chage|systemctl|dmesg|/var/log|/boot|/usr|/proc",
            "nw-linuxsvc": r"BIND|named|httpd|Apache|iptables|vsftpd|FTP|Samba|KeepAlive|listen-on|zone|DNS 서버|웹서버|웹 서버|방화벽|resolv|nginx|/etc/hosts|Passive|Active Mode",
        },
        4: {
            "nw-device": r"스위치|Switch|VLAN|라우터|허브|Hub|브리지|리피터|L2|L3|L4|트렁크|PoE|STP|게이트웨이|로드 ?밸런|무선 AP|AP\b|공유기",
            "nw-routing": r"RIP|OSPF|BGP|IGRP|EIGRP|라우팅|거리 ?벡터|링크 ?상태|벨만|다익스트라|Distance Vector|Link State|AS\b|IDRP|EGP",
            "nw-media": r"방화벽|IDS|IPS|UTM|케이블|광섬유|동축|UTP|STP|RAID|NAS|SAN|전송 매체|보안|Core|클래딩|DAS|스토리지|NAC",
        },
    },
}
ORDER = {
    "lm": {1: ["lm-shell", "lm-perm", "lm-disk", "lm-proc", "lm-pkg", "lm-editor", "lm-print"], 2: ["lm-xwin", "lm-net", "lm-netcmd", "lm-svc", "lm-virt"]},
    "nw": {1: ["nw-ip", "nw-tcpudp", "nw-proto", "nw-ipv6"], 2: ["nw-osi", "nw-lan", "nw-wireless", "nw-cloud"], 3: ["nw-win", "nw-linux", "nw-linuxsvc"], 4: ["nw-device", "nw-routing", "nw-media"]},
}

out, low = {}, []
counts = Counter()
for cert in ("lm", "nw"):
    comp = {s: {c: re.compile(p, re.I) for c, p in d.items()} for s, d in R[cert].items()}
    for f in sorted(glob.glob(f"data/{cert}/*.json")):
        d = json.load(open(f, encoding="utf-8"))
        for q in d["q"]:
            text = " ".join([q["t"], q.get("box", ""), q.get("fig", ""), *q["o"]])
            stem = " ".join([q["t"], q.get("box", ""), q.get("fig", "")])
            best, bs, second = None, -1, -1
            for c in ORDER[cert][q["s"]]:
                rx = comp[q["s"]][c]
                sc = len(rx.findall(stem)) * 3 + len(rx.findall(text))
                if sc > bs:
                    best, second, bs = c, bs, sc
                elif sc > second:
                    second = sc
            if best == "lm-net":
                ans = q["o"][q["a"] - 1]
                if re.search(r"명령|파일명|파일로|디렉터리로|옵션|상태값|저장된", q["t"]) or re.match(r"/etc|ip|ifconfig|ethtool|netstat|ss|route|arp|mii-tool|ping", ans) or re.search(r"/etc/(hosts|resolv|sysconfig|services)", text):
                    best = "lm-netcmd"
            qid = f"{d['id']}#{q['n']}"
            out[qid] = best
            counts[best] += 1
            if bs == 0 or bs - second <= 1:
                low.append((qid, best, bs, second, q["t"][:60]))
out.update(json.load(open("content/chapter-override.json", encoding="utf-8")))
json.dump(out, open("content/chapter-map.json", "w", encoding="utf-8"), ensure_ascii=False)
print(json.dumps(counts, ensure_ascii=False, indent=1))
print("low-confidence:", len(low))
if len(sys.argv) > 1:
    for x in low:
        print(x)
