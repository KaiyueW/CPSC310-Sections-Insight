import { useState } from 'react';

interface InsightQueryProps {
	datasets: any[];
	onQuery: (datasetId: string, queryType: string) => Promise<any>;
	loading: boolean;
}

function InsightQuery({ datasets, onQuery, loading }: InsightQueryProps) {
	const [selectedDataset, setSelectedDataset] = useState('');
	const [selectedQuery, setSelectedQuery] = useState('1');
	const [error, setError] = useState('');

	const handleQuery = async () => {
		setError('');
		if (!selectedDataset) {
			setError('Please select a dataset');
			return;
		}

		const result = await onQuery(selectedDataset, selectedQuery);
		if (!result.success) {
			setError(result.error || 'Unknown error');
		}
	};

	return (
		<div className="card shadow-xl rounded-2xl component-left-border-query component-bg">
			<div className="card-body p-4">
				<h2 className="text-lg font-bold mb-3 text-title">
					Insight Dataset
				</h2>
				<div className="form-control mb-2">
					<label className="label px-0 pb-0.5">
						<span className="text-sm font-bold text-black">Dataset</span>
					</label>
					<select
						className="select w-full rounded-xl border-2 border-border focus:border-focus-border focus:outline-none transition-all bg-white text-sm font-medium h-9 min-h-9 text-black"
						value={selectedDataset}
						onChange={(e) => setSelectedDataset(e.target.value)}
					>
						<option value="">Choose dataset...</option>
						{datasets.map((ds) => (
							<option key={ds.id} value={ds.id}>
								{ds.id}
							</option>
						))}
					</select>
				</div>
				<div className="form-control mb-2">
					<label className="label px-0 pb-0.5">
						<span className="text-sm font-bold text-black">Query Type</span>
					</label>
					<select
						className="select w-full rounded-xl border-2 border-border focus:border-focus-border focus:outline-none transition-all bg-white text-sm font-medium h-9 min-h-9 text-black"
						value={selectedQuery}
						onChange={(e) => setSelectedQuery(e.target.value)}
					>
						<option value="1">The pass and fail percentage of all CPSC courses </option>
						<option value="2">2011-2016 all CPSC courses average change</option>
						<option value="3">The count of courses in each department where more than 150 students failed </option>
					</select>
				</div>
				{error && (
					<div className="alert mb-2 py-2 rounded-xl shadow-md bg-red-100 border-2 border-red-300">
						<span className="text-sm font-semibold text-red-700">{error}</span>
					</div>
				)}
				<div className="card-actions justify-end">
					<button
						className="btn rounded-xl px-5 h-9 min-h-9 text-sm font-bold shadow-md hover:shadow-lg transition-all hover:scale-105 bg-button-primary hover:bg-button-hover text-white border-none"
						onClick={handleQuery}
						disabled={loading}
					>
						{loading ? <span className="loading loading-spinner loading-sm"></span> : 'Query'}
					</button>
				</div>
			</div>
		</div>
	);
}

export default InsightQuery;
