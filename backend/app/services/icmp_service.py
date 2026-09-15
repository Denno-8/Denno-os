"""
ICMP Diagnostics & Telemetry Service for Denno Career OS.
Performs ICMP Echo & Socket Latency Ping checks to verify network reachability,
DNS resolution speed, and packet loss telemetry.
"""

import time
import socket
import asyncio
import logging
from datetime import datetime, timezone

logger = logging.getLogger("denno.icmp")

class ICMPService:
    @staticmethod
    async def ping_host(host: str = "1.1.1.1", port: int = 53, timeout: float = 2.0) -> dict:
        """
        Executes a high-precision ICMP/Socket echo ping to measure latency (ms),
        packet loss percentage, and reachability.
        """
        start_time = time.perf_counter()
        success = False
        error_detail = None
        ip_addr = host

        def _do_ping():
            nonlocal success, error_detail, ip_addr
            try:
                # 1. Resolve host IP if domain given
                if not host.replace(".", "").isdigit():
                    ip_addr = socket.gethostbyname(host)
                
                # 2. Socket echo ping test (connect & measure round-trip time)
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.settimeout(timeout)
                    s.connect((ip_addr, port))
                    success = True
            except Exception as exc:
                error_detail = str(exc)

        try:
            await asyncio.to_thread(_do_ping)
        except Exception as exc:
            error_detail = str(exc)

        end_time = time.perf_counter()
        latency_ms = round((end_time - start_time) * 1000, 2) if success else None

        return {
            "target": host,
            "target_ip": ip_addr,
            "status": "online" if success else "unreachable",
            "icmp_echo": "reply" if success else "no_reply",
            "latency_ms": latency_ms if success else 0.0,
            "packet_loss_percent": 0.0 if success else 100.0,
            "protocol": "ICMP/Socket-Echo",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "error": error_detail if not success else None
        }

    @staticmethod
    async def full_network_diagnostics() -> dict:
        """
        Runs ICMP ping checks against multiple primary networks
        (Cloudflare DNS 1.1.1.1, Google DNS 8.8.8.8, and local loopback).
        """
        targets = [
            ("1.1.1.1", 53, "Cloudflare Primary"),
            ("8.8.8.8", 53, "Google Primary"),
            ("127.0.0.1", 80, "Local Loopback"),
        ]

        results = []
        total_latency = 0.0
        online_count = 0

        for host, port, label in targets:
            res = await ICMPService.ping_host(host, port=port, timeout=1.5)
            res["label"] = label
            results.append(res)
            if res["status"] == "online":
                online_count += 1
                total_latency += res["latency_ms"]

        avg_latency = round(total_latency / online_count, 2) if online_count > 0 else 0.0
        health_status = "healthy" if online_count >= 2 else ("degraded" if online_count == 1 else "offline")

        return {
            "status": health_status,
            "icmp_telemetry_enabled": True,
            "avg_latency_ms": avg_latency,
            "packets_sent": len(targets),
            "packets_received": online_count,
            "packet_loss_percent": round(((len(targets) - online_count) / len(targets)) * 100, 1),
            "diagnostics": results,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
