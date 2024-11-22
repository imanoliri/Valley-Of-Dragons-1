import pandas as pd
import math
import json
from typing import List


def main():
    battle_name = "battle_1"
    battle_dir = f"contents/{battle_name}"
    excel_file = f"{battle_dir}/{battle_name}.xlsx"

    df_nodes = pd.read_excel(excel_file, "nodes")
    df_interactions = pd.read_excel(excel_file, "interactions")
    df_units = pd.read_excel(excel_file, "units")

    networks = dict.fromkeys(["melee", "archer", "flier"])

    with open(f"{battle_dir}/nodes.json", "w") as fp:
        json.dump(nodes_to_json(df_nodes), fp)

    with open(f"{battle_dir}/units.json", "w") as fp:
        json.dump(units_to_json(df_units), fp)

    for network in networks:

        dfn = pd.DataFrame()
        if not df_interactions.empty:
            dfn = df_interactions.loc[~df_interactions.loc[:, network].isna()]

        network_interactions = interactions_from_nodes_and_interactions(df_nodes, dfn, network)

        if network == "archer":  # Remove archer interactions if there is an equivalent melee one to avoid redundancy
            melee_network = networks["melee"]
            network_interactions = [i for i in network_interactions if i not in melee_network]

        networks[network] = network_interactions
        with open(f"{battle_dir}/{network}_interactions.json", "w") as fp:
            json.dump(network_interactions, fp)


def nodes_to_json(df_nodes) -> List[dict]:
    return df_to_json(df_nodes, 3)


def units_to_json(df_units) -> List[dict]:
    return df_to_json(df_units)


def df_to_json(df, nr_cols=None) -> List[dict]:
    cols = df.columns
    if nr_cols is not None:
        cols = df.columns[:nr_cols]
    return [dict(zip(cols, [None if pd.isnull(v) else v for v in vals])) for vals in df.loc[:, cols].values]


def interactions_from_nodes_and_interactions(df_nodes, df_interactions, network) -> pd.DataFrame:
    interactions = []
    for id1 in df_nodes.id:
        for id2 in df_nodes.id:
            if id1 == id2:
                continue

            node_1 = df_nodes.loc[df_nodes.id == id1].iloc[0]
            node_2 = df_nodes.loc[df_nodes.id == id2].iloc[0]

            if nodes_valid_interaction(node_1, node_2, df_interactions, network):
                interactions.append([id1, id2])

    return interactions


def nodes_valid_interaction(node_1, node_2, df_interactions, network) -> bool:
    networks = network
    if isinstance(network, str):
        networks = [network]

    if df_interactions.empty:  # If not manual interactions, just use network's validation function
        return validation_functions[network](node_1, node_2)

    # If no manual interactions found for this pair, just use network's validation function
    validity = any(validation_functions[n](node_1, node_2) for n in networks)
    for i, interaction in df_interactions.iterrows():
        if not nodes_in_interaction(node_1, node_2, interaction):
            continue

        valid_flags = interaction[networks]
        if valid_flags.min() == -2:  # Force false! Overcomes any further interaction rules!
            return False
        if valid_flags.max() == +2:  # Force true! Overcomes any further interaction rules!
            return True
        if valid_flags.min() == -1:  # False! Overcomes any other rules in the selected interaction!
            validity = False
        if valid_flags.max() == +1:  # Force true! Overcomes other rules in the selected interaction!
            validity = True
    return validity


def nodes_in_interaction(node_1, node_2, interaction) -> bool:
    if node_in_interaction(node_1, interaction["from"]) and node_in_interaction(node_2, interaction["to"]):
        return True
    return False


def node_in_interaction(node, inter) -> bool:
    ints = inter.split(",")
    group_columns = [c for c in node.index if c.startswith("group_")]
    if node.id in ints or any(g in ints or "all" in ints for g in node[group_columns] if not pd.isnull(g)):
        return True
    return False


def valid_melee_interaction(
    node_1, node_2, melee_height_threshold: float = 2, melee_distance_threshold: float = 4.5
) -> bool:
    if abs(node_1.z - node_2.z) > melee_height_threshold:
        return False
    return distance(node_1, node_2) < melee_distance_threshold


def valid_archer_interaction(
    node_1, node_2, archer_distance_threshold: float = 4.5, gain_per_height: float = 0.5
) -> bool:
    return distance(node_1, node_2) < archer_distance_threshold * (
        1 + gain_per_height * max([0, (node_1.z - node_2.z)])
    )


def valid_flier_interaction(node_1, node_2, flier_distance_threshold: float = 10.0) -> bool:
    return distance_3d(node_1, node_2) < flier_distance_threshold


def distance(node_1, node_2) -> float:
    return euclidean_distance(node_1.x, node_1.y, node_2.x, node_2.y)


def distance_3d(node_1, node_2) -> float:
    return euclidean_distance_3d(node_1.x, node_1.y, node_1.z, node_2.x, node_2.y, node_2.z)


def euclidean_distance(x1, y1, x2, y2) -> float:
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)


def euclidean_distance_3d(x1, y1, z1, x2, y2, z2) -> float:
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2)


validation_functions = {
    "melee": valid_melee_interaction,
    "archer": valid_archer_interaction,
    "flier": valid_flier_interaction,
}


if __name__ == "__main__":
    main()
