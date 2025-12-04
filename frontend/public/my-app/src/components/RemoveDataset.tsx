import { useState } from 'react';

interface RemoveDatasetProps {
	datasets: any[];
	onRemove: (id: string) => Promise<any>;
	loading: boolean;
}

function RemoveDataset({ datasets, onRemove, loading }: RemoveDatasetProps) {
	const [selectedId, setSelectedId] = useState('');
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);

	const handleRemove = async () => {
		setError('');
		setSuccess(false);
		if (!selectedId) {
			setError('Please select a dataset');
			return;
		}

		const result = await onRemove(selectedId);
		if (result.success) {
			setSelectedId('');
			setSuccess(true);
			setTimeout(() => setSuccess(false), 2000);
		} else {
			setError(result.error || 'Unknown error');
		}
	};

	return (
		<div className="card shadow-xl rounded-2xl component-left-border-remove component-bg">
			<div className="card-body p-4">
				<h2 className="text-lg font-bold mb-3 text-title">
					Remove Dataset
				</h2>
				<div className="flex gap-3">
					<div className="form-control flex flex-col flex-1">
						<label className="label px-0 pb-0.5">
							<span className="text-sm font-bold text-black">Select Dataset ID</span>
						</label>
						<select
							className="select w-full rounded-xl border-2 border-border focus:border-focus-border focus:outline-none transition-all h-9 min-h-9 bg-white text-sm font-medium text-black"
							value={selectedId}
							onChange={(e) => setSelectedId(e.target.value)}
						>
							<option value="">Choose dataset...</option>
							{datasets.map((ds) => (
								<option key={ds.id} value={ds.id}>
									{ds.id}
								</option>
							))}
						</select>
					</div>

					<div className="flex flex-col justify-end">
						<button
							className="btn rounded-xl px-5 h-9 min-h-9 text-sm font-bold shadow-md hover:shadow-lg transition-all hover:scale-105 bg-button-primary hover:bg-button-hover text-white border-none"
							onClick={handleRemove}
							disabled={loading}
						>
							{loading ? <span className="loading loading-spinner loading-sm"></span> : 'Remove'}
						</button>
					</div>
				</div>
				{success && (
					<div className="alert mt-3 py-2 rounded-xl shadow-md bg-green-100 border-2 border-green-300">
						<span className="text-sm font-semibold text-green-700">Dataset removed successfully!</span>
					</div>
				)}
				{error && (
					<div className="alert mt-3 py-2 rounded-xl shadow-md bg-red-100 border-2 border-red-300">
						<span className="text-sm font-semibold text-red-700">{error}</span>
					</div>
				)}
			</div>
		</div>
	);
}

export default RemoveDataset;
