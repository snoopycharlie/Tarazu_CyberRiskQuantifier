"""
services/blast_radius.py — Network graph traversal for blast radius analysis.

Uses networkx to find all downstream-reachable assets from a compromised node,
accumulating their EAL into a total downstream ₹ exposure figure.
"""
from __future__ import annotations
import logging
from typing import Optional

try:
    import networkx as nx
    HAS_NX = True
except ImportError:
    HAS_NX = False
    logger = logging.getLogger(__name__)
    logger.warning("networkx not installed — blast radius will use simple traversal")

logger = logging.getLogger(__name__)


def build_graph(edges: list[dict]) -> "nx.DiGraph":
    """Build a directed graph from a list of {source_asset_id, target_asset_id, dependency_strength} dicts."""
    G = nx.DiGraph()
    strength_weights = {"weak": 0.3, "moderate": 0.6, "strong": 1.0}
    for edge in edges:
        src = edge["source_asset_id"]
        tgt = edge["target_asset_id"]
        strength = edge.get("dependency_strength", "moderate")
        G.add_edge(src, tgt, weight=strength_weights.get(strength, 0.6), strength=strength)
    return G


def compute_blast_radius(
    origin_asset_id: str,
    edges: list[dict],
    asset_eal_map: dict[str, float],  # {asset_id: eal_inr}
    asset_name_map: dict[str, str],   # {asset_id: name}
) -> dict:
    """
    Compute the blast radius from the origin_asset_id.
    Returns all downstream reachable assets and their summed EAL.
    """
    if not edges:
        return {
            "origin_asset_id": origin_asset_id,
            "origin_asset_name": asset_name_map.get(origin_asset_id, origin_asset_id),
            "reachable_asset_ids": [],
            "reachable_asset_names": [],
            "total_downstream_exposure_inr": 0.0,
            "hop_count": 0,
            "traversal_path": [],
        }

    if HAS_NX:
        return _compute_with_networkx(origin_asset_id, edges, asset_eal_map, asset_name_map)
    else:
        return _compute_simple_bfs(origin_asset_id, edges, asset_eal_map, asset_name_map)


def _compute_with_networkx(
    origin_asset_id: str,
    edges: list[dict],
    asset_eal_map: dict[str, float],
    asset_name_map: dict[str, str],
) -> dict:
    G = build_graph(edges)

    if origin_asset_id not in G:
        # Node may exist but have no outgoing edges — add it
        G.add_node(origin_asset_id)

    try:
        descendants = list(nx.descendants(G, origin_asset_id))
    except nx.NetworkXError:
        descendants = []

    # Build traversal path with shortest path depths
    traversal_path = []
    total_eal = 0.0

    for node in descendants:
        eal = asset_eal_map.get(node, 0.0)
        total_eal += eal
        try:
            path_len = nx.shortest_path_length(G, origin_asset_id, node)
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            path_len = -1

        # Get the edge strength on the most critical path
        try:
            path = nx.shortest_path(G, origin_asset_id, node)
            if len(path) >= 2:
                edge_data = G.get_edge_data(path[-2], path[-1], {})
                strength = edge_data.get("strength", "moderate")
            else:
                strength = "unknown"
        except Exception:
            strength = "unknown"

        traversal_path.append({
            "asset_id": node,
            "asset_name": asset_name_map.get(node, node),
            "hops": path_len,
            "strength": strength,
            "eal_inr": eal,
        })

    traversal_path.sort(key=lambda x: x["hops"])

    return {
        "origin_asset_id": origin_asset_id,
        "origin_asset_name": asset_name_map.get(origin_asset_id, origin_asset_id),
        "reachable_asset_ids": descendants,
        "reachable_asset_names": [asset_name_map.get(d, d) for d in descendants],
        "total_downstream_exposure_inr": round(total_eal, 2),
        "hop_count": max((p["hops"] for p in traversal_path), default=0),
        "traversal_path": traversal_path,
    }


def _compute_simple_bfs(
    origin_asset_id: str,
    edges: list[dict],
    asset_eal_map: dict[str, float],
    asset_name_map: dict[str, str],
) -> dict:
    """Simple BFS fallback when networkx is not available."""
    adj: dict[str, list[dict]] = {}
    for edge in edges:
        src = edge["source_asset_id"]
        tgt = edge["target_asset_id"]
        adj.setdefault(src, []).append({"id": tgt, "strength": edge.get("dependency_strength", "moderate")})

    visited: set[str] = set()
    queue = [(origin_asset_id, 0, "origin")]
    traversal_path = []
    total_eal = 0.0

    while queue:
        current, hops, strength = queue.pop(0)
        if current in visited:
            continue
        visited.add(current)
        if current != origin_asset_id:
            eal = asset_eal_map.get(current, 0.0)
            total_eal += eal
            traversal_path.append({
                "asset_id": current,
                "asset_name": asset_name_map.get(current, current),
                "hops": hops,
                "strength": strength,
                "eal_inr": eal,
            })
        for neighbor in adj.get(current, []):
            if neighbor["id"] not in visited:
                queue.append((neighbor["id"], hops + 1, neighbor["strength"]))

    descendants = [p["asset_id"] for p in traversal_path]
    return {
        "origin_asset_id": origin_asset_id,
        "origin_asset_name": asset_name_map.get(origin_asset_id, origin_asset_id),
        "reachable_asset_ids": descendants,
        "reachable_asset_names": [asset_name_map.get(d, d) for d in descendants],
        "total_downstream_exposure_inr": round(total_eal, 2),
        "hop_count": max((p["hops"] for p in traversal_path), default=0),
        "traversal_path": traversal_path,
    }
