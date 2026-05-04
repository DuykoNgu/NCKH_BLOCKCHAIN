"""
Network Utilities for EduChain
Helper functions for P2P networking
"""
import re
import hashlib
from typing import Optional
import ipaddress


def is_valid_ip(ip: str) -> bool:
    """
    Validate IP address format
    Supports both IPv4 and IPv6
    """
    try:
        ipaddress.ip_address(ip)
        return True
    except ValueError:
        return False


def is_valid_port(port: int) -> bool:
    """Validate port number"""
    return 1 <= port <= 65535


def create_peer_id(ip: str, port: int) -> str:
    """
    Generate unique peer identifier from IP and port
    Uses SHA-256 hash
    """
    data = f"{ip}:{port}".encode()
    return hashlib.sha256(data).hexdigest()[:16]


def verify_peer_signature(public_key: str, message: str, signature: str) -> bool:
    """
    Verify peer authentication signature
    TODO: Implement actual ECDSA signature verification
    """
    # Placeholder - should use ECDSA verification
    # from app.utils.CryptoUtils import verify_signature
    # return verify_signature(public_key, message, signature)
    return True


def calculate_fan_out(total_peers: int, factor: float = 0.5, 
                     min_k: int = 3, max_k: int = 10) -> int:
    """
    Calculate optimal gossip fan-out factor
    Formula: k = sqrt(N) * factor
    
    Args:
        total_peers: Total number of peers in network
        factor: Multiplication factor (default 0.5)
        min_k: Minimum fan-out (default 3)
        max_k: Maximum fan-out (default 10)
    
    Returns:
        Optimal fan-out value
    """
    import math
    
    if total_peers == 0:
        return 0
    
    k = int(math.sqrt(total_peers) * factor)
    k = max(min_k, min(k, max_k))
    k = min(k, total_peers)
    
    return k


def format_peer_address(ip: str, port: int) -> str:
    """Format peer address as IP:port"""
    return f"{ip}:{port}"


def parse_peer_address(address: str) -> Optional[tuple]:
    """
    Parse peer address string into (ip, port) tuple
    Supports formats: "ip:port" or "http://ip:port"
    """
    # Remove http:// or https:// prefix
    address = re.sub(r'^https?://', '', address)
    
    # Split by colon
    parts = address.split(':')
    
    if len(parts) != 2:
        return None
    
    ip = parts[0]
    try:
        port = int(parts[1])
    except ValueError:
        return None
    
    if not is_valid_ip(ip) or not is_valid_port(port):
        return None
    
    return (ip, port)


def get_peer_url(ip: str, port: int, endpoint: str = "") -> str:
    """
    Construct full URL for peer endpoint
    
    Args:
        ip: Peer IP address
        port: Peer port
        endpoint: API endpoint (should start with /)
    
    Returns:
        Full URL string
    """
    base_url = f"http://{ip}:{port}"
    
    if endpoint:
        if not endpoint.startswith('/'):
            endpoint = '/' + endpoint
        return base_url + endpoint
    
    return base_url


def calculate_network_latency(start_time: float, end_time: float) -> float:
    """Calculate network latency in milliseconds"""
    return (end_time - start_time) * 1000


def is_localhost(ip: str) -> bool:
    """Check if IP is localhost"""
    return ip in ['127.0.0.1', 'localhost', '::1', '0.0.0.0']


def is_private_ip(ip: str) -> bool:
    """Check if IP is in private range"""
    try:
        ip_obj = ipaddress.ip_address(ip)
        return ip_obj.is_private
    except ValueError:
        return False


def sanitize_peer_data(data: dict) -> dict:
    """
    Sanitize peer data for safe storage/transmission
    Removes potentially dangerous fields
    """
    allowed_fields = {
        'peer_id', 'ip_address', 'port', 'public_key', 
        'node_type', 'is_active', 'last_seen'
    }
    
    return {k: v for k, v in data.items() if k in allowed_fields}


if __name__ == "__main__":
    # Test network utilities
    print("=== Testing Network Utilities ===\n")
    
    # Test IP validation
    print("IP Validation:")
    test_ips = ['192.168.1.1', '10.0.0.1', '256.1.1.1', 'invalid']
    for ip in test_ips:
        print(f"  {ip}: {is_valid_ip(ip)}")
    
    # Test port validation
    print("\nPort Validation:")
    test_ports = [80, 5000, 0, 65536, -1]
    for port in test_ports:
        print(f"  {port}: {is_valid_port(port)}")
    
    # Test peer ID generation
    print("\nPeer ID Generation:")
    peer_id = create_peer_id('10.0.1.1', 5000)
    print(f"  10.0.1.1:5000 → {peer_id}")
    
    # Test fan-out calculation
    print("\nFan-out Calculation:")
    for n in [5, 10, 20, 50]:
        k = calculate_fan_out(n)
        print(f"  N={n} → k={k}")
    
    # Test address parsing
    print("\nAddress Parsing:")
    test_addresses = ['10.0.1.1:5000', 'http://192.168.1.1:8080', 'invalid']
    for addr in test_addresses:
        result = parse_peer_address(addr)
        print(f"  {addr} → {result}")
    
    # Test URL construction
    print("\nURL Construction:")
    url = get_peer_url('10.0.1.1', 5000, '/api/v1/peers')
    print(f"  {url}")
