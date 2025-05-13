import json
import os
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt

all_runs_data = []

for root, dirs, files in os.walk("output"):
    for file in files:
        if file.endswith(".json"):
            full_path = os.path.join(root, file)
            #json_files.append(full_path)
            try:
                with open(full_path, 'r') as f:
                    data = json.load(f)
                    run_data = []
                    run_data.extend([data["endLog"]["totalTimeSteps"],data["endLog"]["totalActions"],data["endLog"]["totalDamageOut"],data["endLog"]["player1DamageOut"],
                                    data["endLog"]["player1TotalActions"],data["endLog"]["player2DamageOut"],data["endLog"]["player2TotalActions"]])
                    all_runs_data.append(run_data)
                    #if value is not None:
                    #    dmgout_vals.append(value)
            except (json.JSONDecodeError, FileNotFoundError) as e:
                print(f"Skipping file {full_path}: {e}")


pca = PCA(n_components=2)

# Fit and transform the data
reduced_data = pca.fit_transform(all_runs_data)

#print("Reduced Data:")
#print(reduced_data)

print("Explained variance ratio:", pca.explained_variance_ratio_)

plt.scatter(reduced_data[:,0], reduced_data[:,1])

# Optional: add labels and title
plt.xlabel(f"PCA 1 {pca.explained_variance_ratio_[0]}")
plt.ylabel(f"PCA 2 {pca.explained_variance_ratio_[0]}")
plt.title("PCA Scatter Plot")

# Show the plot
plt.show()


