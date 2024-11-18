import pandas as pd
import json
import os
import math
from itertools import product


def read_json(filepath):
    with open(filepath, "r") as file:
        return json.load(file)


def get_battle_game_xlsx_links(base_path):
    return [
        f"{base_path}/{content_name}/{content_name}.xlsx"
        for content_name in os.listdir(base_path)
        if os.path.isfile(f"{base_path}/{content_name}/{content_name}.xlsx")
        and "battle_game" in content_name
    ]


def nodes_to_json(df):
    return [{"id": int(i), "x": x, "y": y} for _, (i, x, y) in df.iterrows()]


def units_to_json(df):
    return [
        {
            "id": int(i),
            "team": int(t),
            "name": n,
            "type": y,
            "attack": int(a),
            "defense": int(d),
            "health": int(h),
            "node": int(o),
            "min_deployment": int(md) if not pd.isnull(md) else md,
            "max_deployment": int(Md) if not pd.isnull(Md) else Md,
        }
        for _, (i, t, n, y, a, d, h, o, md, Md) in df.iterrows()
    ]


def pairs_nodes_closer_than(nodes, distance_function, max_distance):
    pairs = []
    for n1 in nodes:
        for n2 in nodes:
            if n1["id"] == n1["id"]:
                continue
            if distance_function(n1["x"], n1["y"], n2["x"], n2["y"]) < max_distance:
                pairs.append([n1, n2])
    return pairs


def euclidean_distance(x1, y1, x2, y2):
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)


def manhattan_distance(x1, y1, x2, y2):
    return abs(x2 - x1) + abs(y2 - y1)


def x_distance(x1, y1, x2, y2):
    return abs(x2 - x1)


def y_distance(x1, y1, x2, y2):
    return abs(y2 - y1)


def node_in_coord_range(node, coord_range, coord: str):
    return coord_range[0] < node[0][coord] < coord_range[1]


def get_pairs(df, df_other=None, add_distances: bool = True):
    if df_other is None:
        df_other = df

    pairs = []
    columns = ["id1", "x1", "y1", "id2", "x2", "y2"]
    for vals1, vals2 in product(
        df.itertuples(index=False, name=None),
        df_other.itertuples(index=False, name=None),
    ):
        pairs.append([*vals1, *vals2])

    df_pairs = pd.DataFrame(pairs, columns=columns)
    df_pairs = df_pairs[df_pairs["id1"] != df_pairs["id2"]]

    if add_distances:
        df_pairs["euclidean_distance"] = df_pairs.apply(
            lambda row: euclidean_distance(*row[["x1", "y1", "x2", "y2"]]), axis=1
        )
        df_pairs["manhattan_distance"] = df_pairs.apply(
            lambda row: manhattan_distance(*row[["x1", "y1", "x2", "y2"]]), axis=1
        )
        df_pairs["x_distance"] = df_pairs.apply(
            lambda row: x_distance(*row[["x1", "y1", "x2", "y2"]]), axis=1
        )
        df_pairs["y_distance"] = df_pairs.apply(
            lambda row: y_distance(*row[["x1", "y1", "x2", "y2"]]), axis=1
        )

    return df_pairs


def save_to_json(data, filepath):
    with open(filepath, "w", encoding="utf-8") as file:
        json.dump(data, file)


def main():
    battle_game_xlsx = "contents/battle_game_2/battle_game_2.xlsx"

    df_nodes = pd.read_excel(battle_game_xlsx, sheet_name="Nodes")
    save_to_json(
        nodes_to_json(df_nodes),
        battle_game_xlsx.replace(".xlsx", "_nodes.json"),
    )

    save_to_json(
        units_to_json(pd.read_excel(battle_game_xlsx, sheet_name="Units")),
        battle_game_xlsx.replace(".xlsx", "_units.json"),
    )

    df_nodes_valley = df_nodes.loc[(3 <= df_nodes.x) & (df_nodes.x <= 5)]
    df_nodes_pairs_valley = get_pairs(df_nodes_valley)
    melee_network_valley = (
        df_nodes_pairs_valley.loc[df_nodes_pairs_valley.euclidean_distance < 1.5]
        .loc[:, ["id1", "id2"]]
        .values.tolist()
    )
    save_to_json(
        melee_network_valley,
        battle_game_xlsx.replace(".xlsx", "_melee_network.json"),
    )

    df_nodes_mountain_left = df_nodes.loc[df_nodes.x <= 2]
    df_nodes_mountain_2_valley_left = get_pairs(df_nodes_mountain_left, df_nodes_valley)
    df_archer_network_left = df_nodes_mountain_2_valley_left.loc[
        (df_nodes_mountain_2_valley_left.x_distance <= 2)
        & (df_nodes_mountain_2_valley_left.y_distance <= 2)
    ]
    archer_network_mountain_left = (
        df_archer_network_left.loc[:, ["id1", "id2"]].values.tolist()
    ) + (df_archer_network_left.loc[:, ["id2", "id1"]].values.tolist())

    df_nodes_mountain_right = df_nodes.loc[6 <= df_nodes.x]
    df_nodes_mountain_2_valley_right = get_pairs(
        df_nodes_mountain_right, df_nodes_valley
    )
    df_archer_network_right = df_nodes_mountain_2_valley_right.loc[
        (df_nodes_mountain_2_valley_right.x_distance <= 2)
        & (df_nodes_mountain_2_valley_right.y_distance <= 2)
    ]

    archer_network_mountain_right = (
        df_archer_network_right.loc[:, ["id1", "id2"]].values.tolist()
    ) + (df_archer_network_right.loc[:, ["id2", "id1"]].values.tolist())

    save_to_json(
        archer_network_mountain_left + archer_network_mountain_right,
        battle_game_xlsx.replace(".xlsx", "_archer_network.json"),
    )


if __name__ == "__main__":
    main()
