// Utility function to format bot responses into structured, professional format
export const formatResponse = (text) => {
  if (!text) return text;

  // First, extract code blocks marked with ```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const codeBlocks = [];
  let match;
  let processedText = text;
  
  // Extract and replace code blocks with placeholders
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const language = match[1] || 'javascript';
    const code = match[2].trim();
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push({ language, code, placeholder });
    processedText = processedText.replace(match[0], placeholder);
  }

  // Split text by double newlines for sections
  const sections = processedText.split(/\n\s*\n/).filter(p => p.trim());
  const formattedSections = [];
  
  sections.forEach((section, sectionIndex) => {
    const lines = section.split('\n').filter(line => line.trim());
    
    lines.forEach((line, lineIndex) => {
      const trimmed = line.trim();
      const key = `${sectionIndex}-${lineIndex}`;
      
      // Check if this is a code block placeholder
      const codeBlockMatch = trimmed.match(/__CODE_BLOCK_(\d+)__/);
      if (codeBlockMatch) {
        const blockIndex = parseInt(codeBlockMatch[1]);
        const codeBlock = codeBlocks[blockIndex];
        if (codeBlock) {
          formattedSections.push({ 
            type: 'code', 
            content: codeBlock.code, 
            language: codeBlock.language,
            key 
          });
        }
        return;
      }
      
      // Check if it's a heading
      if (/^#+\s/.test(trimmed) || /^[🌍🧠🔒💡⚡📚🎯🚀✨🔧📊🎨💻🌟📝🔍⭐🎪🎭🎨🎯🎪].+/.test(trimmed) || (trimmed.length < 100 && trimmed.endsWith(':')) || /^={3,}$/.test(trimmed)) {
        if (/^={3,}$/.test(trimmed)) return; // Skip separator lines
        const level = trimmed.match(/^#+/) ? trimmed.match(/^#+/)[0].length : 1;
        const content = trimmed.replace(/^#+\s*/, '').replace(/:$/, '');
        formattedSections.push({ type: 'heading', content, level, key });
      }
      // Check if it's a list item
      else if (/^[-*•]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
        formattedSections.push({ type: 'list-item', content: trimmed, key });
      }
      // Regular paragraph
      else if (trimmed.length > 0 && !trimmed.match(/^(Code|PYTHON|JAVASCRIPT|JAVA|SQL|JSON)$/)) {
        if (trimmed.length > 200) {
          const sentences = trimmed.split(/(?<=[.!?])\s+/);
          let currentChunk = '';
          
          sentences.forEach((sentence, sentIndex) => {
            if (currentChunk.length + sentence.length > 200 && currentChunk.length > 0) {
              formattedSections.push({ type: 'paragraph', content: currentChunk.trim(), key: `${key}-${sentIndex}` });
              currentChunk = sentence;
            } else {
              currentChunk += (currentChunk ? ' ' : '') + sentence;
            }
          });
          
          if (currentChunk.trim()) {
            formattedSections.push({ type: 'paragraph', content: currentChunk.trim(), key: `${key}-final` });
          }
        } else {
          formattedSections.push({ type: 'paragraph', content: trimmed, key });
        }
      }
    });
  });
  
  return formattedSections;
};

// Function to detect and format different content types within text
export const formatTextContent = (text) => {
  // Handle inline code
  text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  
  // Handle bold text
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Handle italic text
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Handle URLs
  text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  
  return text;
};