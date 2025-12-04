import { useState, useRef } from 'react';


interface AddDatasetProps {
	onAdd: (id: string, file: File) => Promise<any>;
	loading: boolean;
}

function AddDataset({ onAdd, loading }: AddDatasetProps) {
	const [id, setId] = useState('');
	const [file, setFile] = useState<File | null>(null);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleAdd = async () => {
		setError('');
		setSuccess(false);
		if (!id || !file) {
			setError('Please provide both ID and file');
			return;
		}

		const result = await onAdd(id, file);
		if (result.success) {
			setId('');
			setFile(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
			setSuccess(true);
			setTimeout(() => setSuccess(false), 2000);
		} else {
			setError(result.error || 'Unknown error');
		}
	};

	return (
		<div className="card shadow-xl rounded-2xl component-left-border-add component-bg">
			<div className="card-body p-4">
				<h2 className="text-lg font-bold mb-3 text-title">
					Add Dataset
				</h2>

				<div className="flex gap-3">
					<div className="form-control flex flex-col form-control-flex-equal">
						<label className="label px-0 pb-0.5">
							<span className="text-sm font-bold text-black">Dataset ID</span>
						</label>
						<input
							type="text"
							placeholder="Enter dataset ID"
							className="input w-full rounded-xl border-2 border-border focus:border-focus-border
							focus:outline-none transition-all h-9 min-h-9 text-sm bg-white placeholder-placeholder text-black"
							value={id}
							onChange={(e) => setId(e.target.value)}
						/>
					</div>

					<div className="form-control flex flex-col form-control-flex-equal">
						<label className="label px-0 pb-0.5">
							<span className="text-sm font-bold text-black">Zip File</span>
						</label>
						<input
							ref={fileInputRef}
							type="file"
							accept=".zip"
							className="file-input w-full rounded-xl border-2 border-border focus:border-focus-border
							focus:outline-none transition-all h-9 min-h-9 text-sm bg-white text-black"
							onChange={(e) => setFile(e.target.files?.[0] || null)}
						/>
					</div>

					<div className="flex flex-col justify-end">
						<button
							className="btn rounded-xl px-5 h-9 min-h-9 text-sm font-bold shadow-md hover:shadow-lg transition-all hover:scale-105 bg-button-primary hover:bg-button-hover text-white border-none"
							onClick={handleAdd}
							disabled={loading}
						>
							{loading ? <span className="loading loading-spinner loading-sm"></span> : 'Add'}
						</button>
					</div>
				</div>

				{success && (
					<div className="alert mt-3 py-2 rounded-xl shadow-md bg-green-100 border-2 border-green-300">
						<span className="text-sm font-semibold text-green-700">Dataset added successfully!</span>
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

export default AddDataset;
