import { useState } from 'react';

export function DaisyUIDemo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">DaisyUI Components Demo</h2>
          <p>Here are some examples of DaisyUI components you can use:</p>
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Buttons</h3>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary">Primary</button>
          <button className="btn btn-secondary">Secondary</button>
          <button className="btn btn-accent">Accent</button>
          <button className="btn btn-outline">Outline</button>
          <button className="btn btn-ghost">Ghost</button>
          <button className="btn btn-link">Link</button>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Alerts</h3>
        <div className="space-y-2">
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>This is an info alert!</span>
          </div>
          <div className="alert alert-success">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Your purchase has been confirmed!</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Modal</h3>
        <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
          Open Modal
        </button>
      </div>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Hello!</h3>
            <p className="py-4">This is a DaisyUI modal example.</p>
            <div className="modal-action">
              <button className="btn" onClick={() => setIsOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Badges</h3>
        <div className="flex flex-wrap gap-2">
          <div className="badge badge-primary">Primary</div>
          <div className="badge badge-secondary">Secondary</div>
          <div className="badge badge-accent">Accent</div>
          <div className="badge badge-outline">Outline</div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Progress</h3>
        <progress className="progress progress-primary w-full" value="70" max="100"></progress>
        <progress className="progress progress-secondary w-full" value="50" max="100"></progress>
      </div>
    </div>
  );
}
