import pandas as pd

# load CSV, skip comment lines at the top
df = pd.read_csv("PS_2026.03.11_10.38.38.csv", comment="#")

# each planet has multiple rows for all the times its been discovered. 
# default_flag == 1 is the most widley used / accurate row of data. 
df = df[df["default_flag"] == 1]

# columns need for the dashboard
cols = {
    "pl_name": "name",
    "discoverymethod": "discovery_method",
    "disc_year": "discovery_year",
    "pl_orbper": "orbital_period",
    "sy_dist": "distance",
    "pl_rade": "planet_radius",
}
df = df[list(cols.keys())].rename(columns=cols)

# drop rows missing discovery_year (need it for all charts)
df = df.dropna(subset=["discovery_year"])
df["discovery_year"] = df["discovery_year"].astype(int)

# round numeric columns to 4 decimals
df["orbital_period"] = df["orbital_period"].round(4)
df["distance"] = df["distance"].round(4)
df["planet_radius"] = df["planet_radius"].round(4)

print(f"Total rows: {len(df)}")
print(f"Missing orbital_period: {df['orbital_period'].isna().sum()}")
print(f"Missing distance: {df['distance'].isna().sum()}")
print(f"Missing planet_radius: {df['planet_radius'].isna().sum()}")
print(f"\nDiscovery methods:\n{df['discovery_method'].value_counts()}")
print(f"\nYear range: {df['discovery_year'].min()} - {df['discovery_year'].max()}")

df.to_csv("data.csv", index=False)
print(f"\nWrote data.csv ({len(df)} rows)")
