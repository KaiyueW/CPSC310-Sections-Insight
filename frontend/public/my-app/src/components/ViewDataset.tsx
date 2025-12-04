interface ViewDatasetsProps {
	datasets: any[];
	onReload: () => Promise<void>;
	loading: boolean;
}

function ViewDataset({ datasets, onReload, loading }: ViewDatasetsProps) {
	return (
		<div className="card shadow-xl rounded-2xl component-left-border-view component-bg">
			<div className="card-body p-4">
				<div className="flex justify-between mb-3">
					<h2 className="text-lg font-bold text-title">
						View Datasets
					</h2>
					<div className="flex flex-col justify-end">
						<button
							className="btn rounded-xl px-5 h-9 min-h-9 text-sm font-bold shadow-md hover:shadow-lg transition-all hover:scale-105 bg-button-primary hover:bg-button-hover text-white border-none"
							onClick={onReload}
							disabled={loading}
						>
							{loading ? <span className="loading loading-spinner loading-sm"></span> : 'Reload'}
						</button>
					</div>
				</div>
				<div className="overflow-x-auto">
					<table className="table table-xs">
						<thead>
						<tr className="border-border">
							<th className="text-black font-bold text-sm">Dataset ID</th>
							<th className="text-black font-bold text-sm">Kind</th>
							<th className="text-black font-bold text-sm">Rows</th>
						</tr>
						</thead>
						<tbody>
						{datasets.length === 0 ? (
							<tr>
								<td colSpan={3} className="text-center text-placeholder font-medium py-4">
									<div>
										<p className="text-sm">No datasets added yet</p>
									</div>
								</td>
							</tr>
						) : (
							datasets.map((ds, index) => (
								<tr key={ds.id} className={`border-border hover:bg-white/50 transition-colors ${index % 2 === 0 ? 'bg-white/30' : ''}`}>
									<td className="font-semibold text-black text-sm">{ds.id}</td>
									<td className="text-black text-sm">{ds.kind}</td>
									<td className="text-black text-sm">{ds.numRows}</td>
								</tr>
							))
						)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

export default ViewDataset;
