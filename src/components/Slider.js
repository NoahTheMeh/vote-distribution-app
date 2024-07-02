import React, { useState } from 'react';

const Slider = ({ min, max, step, initialValue, onChange, label }) => {
    const [localValue, setLocalValue] = useState(initialValue);

    const handleChange = (e) => {
        setLocalValue(parseInt(e.target.value));
    };

    const handleRelease = () => {
        onChange(localValue);
    };

    return (
        <div className="slider">
            <label>{label}: {localValue}</label>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={localValue}
                onChange={handleChange}
                onMouseUp={handleRelease}
                onTouchEnd={handleRelease}
            />
        </div>
    );
};

export default Slider;
