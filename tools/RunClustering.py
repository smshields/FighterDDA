import json
import os
import numpy as np
import csv
import statistics
from datetime import datetime
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import DBSCAN
from sklearn.neighbors import NearestNeighbors
from itertools import combinations
from scipy.spatial import ConvexHull


import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import matplotlib.patches as mpatches

fight_type_metrics = ["totalTimeSteps", "totalActions", "numLeadChangesByValue", "totalDamageOut", "winningPlayerRemainingHP", "player1To2ActionRatio" ]

#fight_descriptor_metrics = ["winningPlayerRemainingHP", "numDirectorChanges", "directorStatChangeAverageAbsolute", "player1To2ActionRatio"]
fight_descriptor_metrics = ["winningPlayerRemainingHP", "player1To2ActionRatio"]

metrics_to_normalize_by_timesteps = ["totalActions", "numLeadChangesByValue", "totalDamageOut", "numDirectorChanges"]



def generate_distinct_colors(n):
    colors = plt.cm.get_cmap('tab20', n) 
    color_dict = {i: mcolors.to_hex(colors(i)) for i in range(n)}
    return color_dict

#EXTRACT ALL DATA FROM THE FIGHTS JSON STORED IN A PARENT FOLDER, RETURN A DICTIONARY OF FOLDERS PROCESSED, AND AN ARRAY OF DATA FOR EACH FIGHT

def extract_all_data(folder):
    print("Starting data extraction")
    all_fights_data = []

    run_source_dict = {}
    run_source = []
    source_folders_processed = 0

    for root, dirs, files in os.walk(folder):
        for file in files:
            if file.endswith(".json"):
                full_path = os.path.join(root, file)
                #json_files.append(full_path)
                try:
                    with open(full_path, 'r') as f:

                        fight_data = {}

                        data = json.load(f)

                        fight_data['fight_name'] = os.path.basename(os.path.dirname(full_path))
                        
                        source_folder = os.path.basename(os.path.dirname(os.path.dirname(full_path)))

                        #If this is our first time processing a run from a folder - add it to our dictionary of folders
                        if source_folder not in run_source_dict:
                            run_source_dict[source_folder]=source_folders_processed
                            #run_source.append(source_folders_processed)
                            #fight_data['source'] = source_folder
                            source_folders_processed+=1
                        #else:
                            #run_source.append(run_source_dict[source_folder])
                        fight_data['source'] = source_folder

                        for val in fight_type_metrics:
                            #TO FIX - SHOULD BE NORMALIZED ON COLLECTION
                            if val in metrics_to_normalize_by_timesteps:
                                fight_data[val]= data["endLog"][val]/data["endLog"]['totalTimeSteps']
                            else: 
                                fight_data[val] = data["endLog"][val]
                            #fight_data[val] = data["endLog"][val]
                        
                        #fight_data['type_data'] =fight_type_data
                        
                        fight_descriptor_data = {}
                        for val in fight_descriptor_metrics:
                            #TO FIX - SHOULD BE NORMALIZED ON COLLECTION
                            if val in metrics_to_normalize_by_timesteps:
                                fight_data[val]= data["endLog"][val]/data["endLog"]['totalTimeSteps']
                            else: 
                                fight_data[val] = data["endLog"][val]
                            #fight_data[val] = data["endLog"][val]

                        #fight_data['description_data'] = fight_descriptor_data


                        all_fights_data.append(fight_data)

                except (json.JSONDecodeError, FileNotFoundError) as e:
                    print(f"Skipping file {full_path}: {e}")

    return run_source_dict, all_fights_data

def get_datamatrix(fights_data, fight_type = True):
    matrix = []
    for fight in fights_data:
        fight_data = []
        val_dict = {}
        #if fight_type:
        #    val_dict = fight['type_data']
        #else:
        #    val_dict = fight['description_data']

        #for key, value in val_dict.items():
        #    fight_data.append(value)

        
        if fight_type:
            for metric in fight_type_metrics:
                fight_data.append(fight[metric])

        else:
            for metric in fight_descriptor_metrics:
                fight_data.append(fight[metric])

        matrix.append(fight_data)
    return matrix

def apply_pca(data, var_req):
    scaler = StandardScaler()
    runs_normalised = scaler.fit_transform(data)


    pca = PCA(n_components=var_req)
    reduced_data = pca.fit_transform(runs_normalised)

    #print("Reduced Data:")
    #print(reduced_data)

    #print("Explained variance ratio:", pca.explained_variance_ratio_)

    print("PCA Singular Values")
    print(pca.singular_values_)

    
    cumulative_variance = np.cumsum(pca.explained_variance_ratio_)

    n_components = np.argmax(cumulative_variance >= 0.90) + 1

    print(n_components)

    for i in range(len(cumulative_variance)):
        print(f"Component {i+1}: {cumulative_variance[i]:.4f}")


    return reduced_data, pca.explained_variance_ratio_

def apply_tsne(data):
    scaler = StandardScaler()
    runs_normalised = scaler.fit_transform(data)
    tsne = TSNE(n_components=2, random_state=42, perplexity=30)
    return tsne.fit_transform(runs_normalised)

def apply_dbscan(data, _eps, _min_samples):
    scaler = StandardScaler()
    runs_normalised = scaler.fit_transform(data)
    db = DBSCAN(eps=_eps, min_samples=_min_samples)
    labels = db.fit_predict(runs_normalised)
    return runs_normalised, labels

def apply_kmeans(data, cluster_count):
    scaler = StandardScaler()
    data_scaled = scaler.fit_transform(data)

    kmeans = KMeans(n_clusters=cluster_count, random_state=0)  # choose number of clusters
    clusters = kmeans.fit_predict(data_scaled)
    return data_scaled, clusters

def vis_kmeans_elbow(data, out_path, title):
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(data)
    inertias = []
    k_range = range(1, 11)  # Try k from 1 to 10

    for k in k_range:
        kmeans = KMeans(n_clusters=k, random_state=0)
        kmeans.fit(X_scaled)
        inertias.append(kmeans.inertia_)

    # Plot the elbow
    plt.plot(k_range, inertias, marker='o')
    plt.xlabel('Number of clusters (k)')
    plt.ylabel('Inertia (within-cluster SSE)')
    plt.title('Elbow Method for Optimal k')
    plt.grid(True)
    #plt.show()
    plt.savefig(f"{out_path}/{title}.png",dpi=300)
    plt.close()

def vis_dbscan_Kdistance(data, out_path, title):
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(data)

    neighbors = NearestNeighbors(n_neighbors=5)
    neighbors_fit = neighbors.fit(X_scaled)  # your data matrix
    distances, indices = neighbors_fit.kneighbors(X_scaled)
    distances = np.sort(distances[:, 4])  # sort 5th nearest distance

    plt.plot(distances)
    plt.title("K-distance graph")
    plt.xlabel("Points sorted by distance")
    plt.ylabel("5th nearest neighbor distance")
    #plt.show()
    plt.savefig(f"{out_path}/{title}.png",dpi=300)
    plt.close()

def generate_scatter(data_xy, point_labels, axis_labels_xy, title, out_path, point_class = [], add_convex_hull = False, add_point_labels = True):
    if(len(point_class)>0):
        unique_labels = list(set(point_class))
        color_map = {label: plt.cm.tab10(i) for i, label in enumerate(unique_labels)}
        point_colors = [color_map[label] for label in point_class]

    plt.scatter(data_xy[:,0], data_xy[:,1], c=point_colors, s=5)

    if (add_point_labels):

        for i in range(len(point_labels)):
            plt.text(data_xy[i,0] + 0.2, data_xy[i,1], point_labels[i], fontsize=6, alpha=0.2)

    #if(add_convex_hull):
        #hull = ConvexHull(data_xy)
        #for simplex in hull.simplices:
            #plt.plot(data_xy[simplex, 0], data_xy[simplex, 1], 'r-')

    if(len(point_class)>0):
        legend_patches = [mpatches.Patch(color=color_map[label], label=label) for label in unique_labels]
        plt.legend(handles=legend_patches, title="Categories")

    plt.xlabel(axis_labels_xy[0])
    plt.ylabel(axis_labels_xy[1])
    plt.title(title)

    # Show the plot
    #plt.show() 
    plt.savefig(f"{out_path}/{title}.png",dpi=300)
    plt.close()

def generate_labeled_era(fights, metrics, cluster_designations, outpath, filelabel):
    metric_pairs = list(combinations(metrics, 2))

    for pair in metric_pairs:
        metric_tuples = []
        fight_labels = []
        for fight in fights:
            metric_tuples.append([fight[pair[0]],fight[pair[1]]])
            fight_labels.append(fight['fight_name'])

        metric_tuples = np.array(metric_tuples)
        
        generate_scatter(metric_tuples, fight_labels, [f"{pair[0]}",f"{pair[1]}"],f"{pair[0]} vs {pair[1]}-{filelabel}", outpath, cluster_designations, True, False)

def get_metric_ranges_for_clusters(fights, metrics, fight_names, fight_cluster_membershiplist, out_path):
    

    #Initialise metric data storage for clusters
    unique_clusters = list(set(fight_cluster_membershiplist))


    cluster_metric_vals = {}
    for cluster in unique_clusters:
        metric_vals = {}
        for metric in metrics:
            metric_vals[metric] = []
        cluster_metric_vals[cluster] = metric_vals


    #Loop through all fights, updating metric info for each cluster
    for i in range(len(fights)):

        curr_fight = fights[i]
        
        if curr_fight['fight_name'] != fight_names[i]:
            print("List order has changed")
        
        for metric in metrics:

            cluster_metric_vals[fight_cluster_membershiplist[i]][metric].append(curr_fight[metric])
    

            
    csv_lines = [["Cluster","Metric", "Mean", "Min", "Max", "Stddev"]]

    with open(f"{out_path}.txt", "w") as f:
        for key, value in cluster_metric_vals.items():
                top_line = f"Cluster {key} values:\n"
                f.write(top_line)
                csv_lines.append([key])
                print(top_line)
                for key2, value2 in value.items():
                    
                    t=f"{key2}:  mean: {statistics.mean(value2)} min: {min(value2)}, max: {max(value2)}, stddev: {statistics.stdev(value2)}\n"
                    f.write(t)
                    print(t)
                    csv_lines.append(["",key2, statistics.mean(value2), min(value2), max(value2), statistics.stdev(value2)])

    with open(f"{out_path}.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerows(csv_lines)

def get_all_data_kmeans(outfolder_name=""):
    visuals_output_dir = f"tools/visuals/{outfolder_name}-{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    os.makedirs(visuals_output_dir, exist_ok=True)

    folders, all_fights = extract_all_data("output")

    for key, val in folders.items():
        print(f"{key} : {val}")


    fight_names = []
    sources = []
    for fight in all_fights:
        fight_names.append(fight['fight_name'])
        sources.append(fight['source'])

    type_matrix = get_datamatrix(all_fights, True)



    #STANDARD RUN

    reduced_data, exp_var = apply_pca(type_matrix, 0.8)
    print("Explained variance ratio:", exp_var)
    generate_scatter(reduced_data, fight_names, [f"PCA 1: {exp_var[0]}",f"PCA 2: {exp_var[1]}"],"PCA Visualisation", visuals_output_dir, sources, True, False)

    tsne_data = apply_tsne(type_matrix)
    generate_scatter(tsne_data, fight_names, [f"TSNE 1",f"TSNE 2"],"TSNE Visualisation", visuals_output_dir, sources, True, False)


    vis_kmeans_elbow(type_matrix, visuals_output_dir, "K-Means Elbow")
    reduced_data, kmeans_clusters = apply_kmeans(type_matrix, 6)

    generate_scatter(reduced_data, fight_names, [f"PCA 1: {exp_var[0]}",f"PCA 2: {exp_var[1]}"],"KMEANS+PCA Visualisation - KM Colouring", visuals_output_dir, kmeans_clusters, True, False)
    generate_scatter(reduced_data, fight_names, [f"PCA 1: {exp_var[0]}",f"PCA 2: {exp_var[1]}"],"KMEANS+PCA Visualisation - Folder Colouring", visuals_output_dir, kmeans_clusters, True, False)

    generate_scatter(tsne_data, fight_names, [f"TSNE 1",f"TSNE 2"],"KMEANS+TSNE Visualisation - KM Colouring", visuals_output_dir, kmeans_clusters, True, False)
    generate_scatter(tsne_data, fight_names, [f"TSNE 1",f"TSNE 2"],"KMEANS+TSNE Visualisation - Folder Colouring", visuals_output_dir, sources, True, False)

    generate_labeled_era(all_fights, fight_descriptor_metrics, sources, visuals_output_dir, 'Source Highlighted')
    generate_labeled_era(all_fights, fight_descriptor_metrics, kmeans_clusters, visuals_output_dir, 'Cluster Highlighted')

    get_metric_ranges_for_clusters(all_fights, fight_type_metrics, fight_names, sources, f"{visuals_output_dir}/source_metric_range")
    get_metric_ranges_for_clusters(all_fights, fight_type_metrics, fight_names, kmeans_clusters, f"{visuals_output_dir}/km_cluster_metric_range")


get_all_data_kmeans("Standard Run-k=6")

#visuals_output_dir = f"tools/visuals/{datetime.now().strftime('%Y%m%d_%H%M%S')}"

#os.makedirs(visuals_output_dir, exist_ok=True)

#folders, all_fights = extract_all_data("output")

#for key, val in folders.items():
    #print(f"{key} : {val}")


#fight_names = []
#sources = []
#for fight in all_fights:
    #fight_names.append(fight['fight_name'])
    #sources.append(fight['source'])

#type_matrix = get_datamatrix(all_fights, True)

#PCA PREPROCESS TESTING


#pca_reduced_data, exp_var = apply_pca(type_matrix, 0.8)
#vis_dbscan_Kdistance(pca_reduced_data, visuals_output_dir, "DBSCAN K Dist")
#scaled_data, dblabels = apply_dbscan(pca_reduced_data, 0.6, 15)

#vis_kmeans_elbow(pca_reduced_data, visuals_output_dir, "K-Means Elbow")
#reduced_data, kmeans_clusters = apply_kmeans(pca_reduced_data, 5)

#tsne_data = apply_tsne(pca_reduced_data)

#generate_scatter(tsne_data, fight_names, [f"PCA 1: {exp_var[0]}",f"PCA 2: {exp_var[1]}"],"DBSCANLabels+PCA-Preprocess+TSNE Visualisation", visuals_output_dir, dblabels, True, False)
#generate_scatter(tsne_data, fight_names, [f"TSNE 1",f"TSNE 2"],"KMEANS+PCA-Preprocess+TSNE Visualisation - DBScan Colouring", visuals_output_dir, kmeans_clusters, True, False)
#generate_scatter(tsne_data, fight_names, [f"TSNE 1",f"TSNE 2"],"KMEANS+TSNE Visualisation - Folder Colouring", visuals_output_dir, sources, True, False)




#STANDARD RUN

#reduced_data, exp_var = apply_pca(type_matrix)
#print("Explained variance ratio:", exp_var)
#generate_scatter(reduced_data, fight_names, [f"PCA 1: {exp_var[0]}",f"PCA 2: {exp_var[1]}"],"PCA Visualisation", visuals_output_dir, sources, True, False)

#tsne_data = apply_tsne(type_matrix)
#generate_scatter(tsne_data, fight_names, [f"TSNE 1",f"TSNE 2"],"TSNE Visualisation", visuals_output_dir, sources, True, False)


#vis_kmeans_elbow(type_matrix, visuals_output_dir, "K-Means Elbow")
#reduced_data, kmeans_clusters = apply_kmeans(type_matrix, 5)

#generate_scatter(reduced_data, fight_names, [f"PCA 1: {exp_var[0]}",f"PCA 2: {exp_var[1]}"],"KMEANS+PCA Visualisation - KM Colouring", visuals_output_dir, kmeans_clusters, True, False)
#generate_scatter(reduced_data, fight_names, [f"PCA 1: {exp_var[0]}",f"PCA 2: {exp_var[1]}"],"KMEANS+PCA Visualisation - Folder Colouring", visuals_output_dir, kmeans_clusters, True, False)

#generate_scatter(tsne_data, fight_names, [f"TSNE 1",f"TSNE 2"],"KMEANS+TSNE Visualisation - KM Colouring", visuals_output_dir, kmeans_clusters, True, False)
#generate_scatter(tsne_data, fight_names, [f"TSNE 1",f"TSNE 2"],"KMEANS+TSNE Visualisation - Folder Colouring", visuals_output_dir, sources, True, False)

#generate_labeled_era(all_fights, fight_descriptor_metrics, sources, visuals_output_dir, 'Source Highlighted')
#generate_labeled_era(all_fights, fight_descriptor_metrics, kmeans_clusters, visuals_output_dir, 'Cluster Highlighted')

#get_metric_ranges_for_clusters(all_fights, fight_type_metrics, fight_names, sources, f"{visuals_output_dir}/source_metric_range")
#get_metric_ranges_for_clusters(all_fights, fight_type_metrics, fight_names, kmeans_clusters, f"{visuals_output_dir}/km_cluster_metric_range")


