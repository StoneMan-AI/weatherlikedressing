import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './CustomSelect.css';

const CustomSelect = ({ value, onChange, options, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  // 计算下拉框位置
  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownMaxHeight = 200;
      const gap = 4;
      
      // 计算下拉框位置
      let top = rect.bottom + gap;
      let left = rect.left;
      let width = rect.width;
      
      // 确保下拉框不超出视口右侧
      if (left + width > viewportWidth) {
        left = viewportWidth - width - 10;
      }
      
      // 确保下拉框不超出视口左侧
      if (left < 10) {
        left = 10;
      }
      
      // 如果下拉框会超出视口底部，则向上展开
      const spaceBelow = viewportHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      
      if (spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow) {
        // 向上展开
        top = rect.top - dropdownMaxHeight - gap;
        if (top < 10) {
          top = 10;
        }
      }
      
      setPosition({
        top: top,
        left: left,
        width: width
      });
    }
  };

  // 当打开时更新位置
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      
      // 监听窗口变化
      const handleResize = () => updatePosition();
      const handleScroll = () => {
        setIsOpen(false);
      };
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // 使用setTimeout确保事件在下一个事件循环中注册
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue) => {
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  return (
    <>
      <div 
        className={`custom-select-wrapper ${className}`} 
        ref={containerRef}
      >
        <div
          className={`custom-select-trigger ${isOpen ? 'is-open' : ''}`}
          onClick={handleToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggle();
            }
          }}
        >
          <span className="custom-select-value">{selectedOption?.label || '请选择'}</span>
          <span className={`custom-select-arrow ${isOpen ? 'is-open' : ''}`}>
            ▼
          </span>
        </div>
      </div>
      
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="custom-select-dropdown"
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
            zIndex: 99999
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              className={`custom-select-option ${value === option.value ? 'is-selected' : ''}`}
              onClick={() => handleSelect(option.value)}
              role="option"
              aria-selected={value === option.value}
            >
              {option.label}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

export default CustomSelect;
