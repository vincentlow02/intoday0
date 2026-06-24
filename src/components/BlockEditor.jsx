import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { Plus, Image as ImageIcon, FileText, Link as LinkIcon, Minus } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

const parseBlocks = (text) => {
  if (!text) return [{ id: generateId(), type: 'text', content: '' }];
  const lines = text.split('\n');
  const blocks = [];
  let currentText = [];

  const flushText = () => {
    if (currentText.length > 0) {
      blocks.push({ id: generateId(), type: 'text', content: currentText.join('\n') });
      currentText = [];
    }
  };

  lines.forEach(line => {
    if (line.trim() === '---') {
      flushText();
      blocks.push({ id: generateId(), type: 'divider' });
      return;
    }
    const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      flushText();
      blocks.push({ id: generateId(), type: 'image', alt: imgMatch[1], url: imgMatch[2] });
      return;
    }
    const fileMatch = line.match(/^\[📄 (.*?)\]\((.*?)\)$/);
    if (fileMatch) {
      flushText();
      blocks.push({ id: generateId(), type: 'file', name: fileMatch[1], url: fileMatch[2] });
      return;
    }
    const linkMatch = line.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch && line === linkMatch[0]) {
      flushText();
      blocks.push({ id: generateId(), type: 'link', text: linkMatch[1], url: linkMatch[2] });
      return;
    }
    
    currentText.push(line);
  });
  
  flushText();

  if (blocks.length === 0) {
    blocks.push({ id: generateId(), type: 'text', content: '' });
  }

  return blocks;
};

const serializeBlocks = (blocks) => {
  return blocks.map(b => {
    if (b.type === 'divider') return '---';
    if (b.type === 'image') return `![${b.alt || ''}](${b.url})`;
    if (b.type === 'file') return `[📄 ${b.name || 'File'}](${b.url})`;
    if (b.type === 'link') return `[${b.text || 'Link'}](${b.url})`;
    return b.content || '';
  }).join('\n');
};

const BlockMenu = ({ onSelect, onClose, rect }) => {
  const [search, setSearch] = useState('');
  
  const items = [
    { type: 'text', icon: <FileText size={16} strokeWidth={1.5} />, title: 'Text', subtitle: 'Just start writing' },
    { type: 'image', icon: <ImageIcon size={16} strokeWidth={1.5} />, title: 'Image', subtitle: 'Upload or embed an image' },
    { type: 'file', icon: <FileText size={16} strokeWidth={1.5} />, title: 'File', subtitle: 'Upload a file' },
    { type: 'link', icon: <LinkIcon size={16} strokeWidth={1.5} />, title: 'Link', subtitle: 'Add a web link' },
    { type: 'divider', icon: <Minus size={16} strokeWidth={1.5} />, title: 'Divider', subtitle: 'Add a divider line' }
  ];

  const filtered = items.filter(item => item.title.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest('.block-editor-menu')) {
        onClose();
      }
    };
    // small timeout to prevent immediate close on the click that opened it
    setTimeout(() => {
      document.addEventListener('mousedown', handleGlobalClick);
    }, 10);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, [onClose]);

  return (
    <div 
      className="block-editor-menu"
      style={{
        position: 'absolute',
        top: '100%',
        left: '20px',
        zIndex: 100,
        marginTop: '8px'
      }}
    >
      <div className="block-editor-menu-search">
        <input 
          autoFocus 
          placeholder="Search blocks..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && filtered.length > 0) {
              onSelect(filtered[0].type);
            }
          }}
        />
      </div>
      <div className="block-editor-menu-list">
        {filtered.map(item => (
          <button key={item.type} className="block-editor-menu-item" onClick={() => onSelect(item.type)}>
            <div className="block-editor-menu-item-icon">
              {item.icon}
            </div>
            <div className="block-editor-menu-item-text">
              <span className="block-editor-menu-item-title">{item.title}</span>
              <span className="block-editor-menu-item-subtitle">{item.subtitle}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const BlockItem = ({ block, index, updateBlock, insertBlock, removeBlock, mergeBlockUp, focusBlock, focusNext, focusPrev, isFocused, setFocusedBlockId }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isFocused && inputRef.current && block.type === 'text') {
      inputRef.current.focus();
    } else if (isFocused && block.type !== 'text') {
      inputRef.current?.focus();
    }
  }, [isFocused]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (block.type === 'text') {
        const cursor = inputRef.current.selectionStart;
        const before = block.content.substring(0, cursor);
        const after = block.content.substring(cursor);
        updateBlock(block.id, { content: before });
        insertBlock(index + 1, { type: 'text', content: after });
      } else {
        insertBlock(index + 1, { type: 'text', content: '' });
      }
    } else if (e.key === 'Backspace') {
      if (block.type === 'text' && inputRef.current.selectionStart === 0 && inputRef.current.selectionEnd === 0) {
        e.preventDefault();
        mergeBlockUp(index);
      } else if (block.type !== 'text') {
        e.preventDefault();
        removeBlock(index);
      }
    } else if (e.key === 'ArrowUp') {
      if (block.type !== 'text' || (inputRef.current && inputRef.current.selectionStart === 0)) {
        e.preventDefault();
        focusPrev(index);
      }
    } else if (e.key === 'ArrowDown') {
      if (block.type !== 'text' || (inputRef.current && inputRef.current.selectionEnd === block.content.length)) {
        e.preventDefault();
        focusNext(index);
      }
    }
  };
  
  const handleInput = (e) => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
      updateBlock(block.id, { content: e.target.value });
    }
  };

  useLayoutEffect(() => {
    if (block.type === 'text' && inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [block.content, block.type]);

  const handleMenuSelect = (type) => {
    setMenuOpen(false);
    if (type === 'text') {
      insertBlock(index + 1, { type: 'text', content: '' });
    } else if (type === 'divider') {
      insertBlock(index + 1, { type: 'divider' });
      insertBlock(index + 2, { type: 'text', content: '' });
    } else if (type === 'image') {
      const url = prompt('Enter Image URL:');
      if (url) {
        insertBlock(index + 1, { type: 'image', url, alt: 'Image' });
        insertBlock(index + 2, { type: 'text', content: '' });
      }
    } else if (type === 'file') {
      const url = prompt('Enter File URL:');
      const name = prompt('Enter File Name (optional):') || 'File';
      if (url) {
        insertBlock(index + 1, { type: 'file', url, name });
        insertBlock(index + 2, { type: 'text', content: '' });
      }
    } else if (type === 'link') {
      const url = prompt('Enter Link URL:');
      const text = prompt('Enter Link Text:') || url;
      if (url) {
        insertBlock(index + 1, { type: 'link', url, text });
        insertBlock(index + 2, { type: 'text', content: '' });
      }
    }
  };

  return (
    <div className={`block-editor-item-container ${isFocused ? 'focused' : ''} ${menuOpen ? 'menu-open' : ''}`}>
      <div className="block-editor-item-gutter">
        <button 
          className="block-editor-add-btn" 
          onClick={() => setMenuOpen(!menuOpen)}
          tabIndex={-1}
          title="Add block"
        >
          <Plus size={16} strokeWidth={2} />
        </button>

        {menuOpen && (
          <BlockMenu onSelect={handleMenuSelect} onClose={() => setMenuOpen(false)} />
        )}
      </div>
      <div className="block-editor-item-content">
        {block.type === 'text' && (
          <textarea
            ref={inputRef}
            className="block-editor-textarea"
            value={block.content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocusedBlockId(block.id)}
            placeholder={index === 0 && !block.content ? "Start typing..." : ""}
            rows={1}
          />
        )}
        {block.type === 'image' && (
          <div className="block-editor-image" tabIndex={0} ref={inputRef} onKeyDown={handleKeyDown} onFocus={() => setFocusedBlockId(block.id)}>
            <img src={block.url} alt={block.alt} />
          </div>
        )}
        {block.type === 'divider' && (
          <div className="block-editor-divider" tabIndex={0} ref={inputRef} onKeyDown={handleKeyDown} onFocus={() => setFocusedBlockId(block.id)}>
            <hr />
          </div>
        )}
        {block.type === 'file' && (
          <div className="block-editor-file" tabIndex={0} ref={inputRef} onKeyDown={handleKeyDown} onFocus={() => setFocusedBlockId(block.id)}>
            <div className="block-editor-file-icon"><FileText size={18} strokeWidth={1.5} /></div>
            <a href={block.url} target="_blank" rel="noreferrer" tabIndex={-1}>{block.name}</a>
          </div>
        )}
        {block.type === 'link' && (
          <div className="block-editor-link" tabIndex={0} ref={inputRef} onKeyDown={handleKeyDown} onFocus={() => setFocusedBlockId(block.id)}>
            <div className="block-editor-link-icon"><LinkIcon size={18} strokeWidth={1.5} /></div>
            <a href={block.url} target="_blank" rel="noreferrer" tabIndex={-1}>{block.text}</a>
          </div>
        )}
      </div>
    </div>
  );
};

const BlockEditor = ({ value, onChange }) => {
  const [blocks, setBlocks] = useState([]);
  const [focusedBlockId, setFocusedBlockId] = useState(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      setBlocks(parseBlocks(value));
      isInitialized.current = true;
    } else {
      if (blocks.length === 0 && value) {
         setBlocks(parseBlocks(value));
      }
    }
  }, [value]);

  const notifyChange = useCallback((newBlocks) => {
    setBlocks(newBlocks);
    onChange(serializeBlocks(newBlocks));
  }, [onChange]);

  const updateBlock = (id, data) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, ...data } : b);
    notifyChange(newBlocks);
  };

  const insertBlock = (index, blockData) => {
    const newBlock = { id: generateId(), ...blockData };
    const newBlocks = [...blocks];
    newBlocks.splice(index, 0, newBlock);
    notifyChange(newBlocks);
    setFocusedBlockId(newBlock.id);
  };

  const removeBlock = (index) => {
    if (blocks.length <= 1) {
      const newBlocks = [{ id: generateId(), type: 'text', content: '' }];
      notifyChange(newBlocks);
      setFocusedBlockId(newBlocks[0].id);
      return;
    }
    const newBlocks = [...blocks];
    newBlocks.splice(index, 1);
    notifyChange(newBlocks);
    setFocusedBlockId(newBlocks[Math.max(0, index - 1)].id);
  };

  const mergeBlockUp = (index) => {
    if (index === 0) return;
    const current = blocks[index];
    const prev = blocks[index - 1];

    if (prev.type === 'text' && current.type === 'text') {
      const newBlocks = [...blocks];
      newBlocks[index - 1] = { ...prev, content: prev.content + current.content };
      newBlocks.splice(index, 1);
      notifyChange(newBlocks);
      setFocusedBlockId(prev.id);
    } else if (prev.type !== 'text' && current.type === 'text' && current.content === '') {
      removeBlock(index);
    } else {
       const newBlocks = [...blocks];
       newBlocks.splice(index - 1, 1);
       notifyChange(newBlocks);
       setFocusedBlockId(current.id);
    }
  };

  const focusPrev = (index) => {
    if (index > 0) setFocusedBlockId(blocks[index - 1].id);
  };

  const focusNext = (index) => {
    if (index < blocks.length - 1) setFocusedBlockId(blocks[index + 1].id);
  };

  return (
    <div className="block-editor-root">
      {blocks.map((block, index) => (
        <BlockItem
          key={block.id}
          block={block}
          index={index}
          updateBlock={updateBlock}
          insertBlock={insertBlock}
          removeBlock={removeBlock}
          mergeBlockUp={mergeBlockUp}
          focusPrev={focusPrev}
          focusNext={focusNext}
          isFocused={focusedBlockId === block.id}
          setFocusedBlockId={setFocusedBlockId}
        />
      ))}
    </div>
  );
};

export default BlockEditor;
