import React, { useState, useRef, useEffect } from 'react';
import './CustomSelect.css';

const CustomSelect = ({ value, onChange, options, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const selectRef = useRef(null);
  const triggerRef = useRef(null);

  // 计算下拉框位置
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const dropdownHeight = 200; // max-height
          const gap = 4; // 间距
          
          // position: fixed 是相对于视口的，不需要加 scrollY/scrollX
          let top = rect.bottom + gap;
          let bottom = null;
          
          // 如果下拉框会超出视口底部，则向上展开
          if (rect.bottom + dropdownHeight + gap > viewportHeight) {
            // 向上展开
            bottom = viewportHeight - rect.top + gap;
            top = null;
          }
          
          setDropdownStyle({
            ...(top !== null ? { top: `${top}px` } : {}),
            ...(bottom !== null ? { bottom: `${bottom}px` } : {}),
            left: `${rect.left}px`,
            width: `${rect.width}px`
          });
        }
      };

      // 立即更新位置
      updatePosition();

      // 监听窗口大小变化和滚动，实时更新位置
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // 滚动时关闭下拉框
      const handleScroll = () => setIsOpen(false);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  const handleSelect = (optionValue) => {
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  return (
    <>
      <div className={`custom-select ${className}`} ref={selectRef}>
        <div
          ref={triggerRef}
          className={`select-trigger ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="select-value">{selectedOption.label}</span>
          <span className={`select-arrow ${isOpen ? 'open' : ''}`}>▼</span>
        </div>
      </div>
      {isOpen && (
        <div className="select-dropdown select-dropdown-fixed" style={dropdownStyle}>
          {options.map((option) => (
            <div
              key={option.value}
              className={`select-option ${value === option.value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default CustomSelect;

