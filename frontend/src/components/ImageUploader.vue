<template>
  <div class="image-uploader">
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      @change="handleFileSelect"
      style="display: none"
    />
    
    <div v-if="!imagePreview" class="upload-area" @click="selectFile">
      <span class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
      </span>
      <span class="text">上传图片</span>
    </div>

    <div v-else class="preview-area">
      <img :src="imagePreview" alt="Preview" />
      <button class="btn-remove" @click.stop="removeImage">✕</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  imageBase64: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['update:imageBase64']);

const fileInput = ref(null);
const imagePreview = ref(null);

// 监听父组件传入的值变化，当清空时同步清空预览
watch(() => props.imageBase64, (newVal) => {
  if (newVal === null) {
    imagePreview.value = null;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
});

function selectFile() {
  fileInput.value?.click();
}

async function handleFileSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    alert('只能上传图片文件');
    return;
  }

  // 检查文件大小（20MB）
  if (file.size > 20 * 1024 * 1024) {
    alert('图片大小不能超过 20MB');
    return;
  }

  try {
    // Canvas 压缩
    const compressed = await compressImage(file);
    imagePreview.value = compressed;
    emit('update:imageBase64', compressed);
  } catch (error) {
    console.error('图片压缩失败:', error);
    alert('图片处理失败');
  }
}

async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 🎯 限制最大尺寸 (优化 Token: 256px 确保不超限)
        const maxSize = 256;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // 🎯 压缩质量 (优化 Token: 从 0.4 开始)
        let quality = 0.4;
        let result = canvas.toDataURL('image/jpeg', quality);

        // 🎯 如果还是太大 (>50KB)，继续压缩
        while (result.length > 50 * 1024 && quality > 0.1) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }

        console.log(`📸 图片压缩完成: ${(result.length / 1024).toFixed(1)}KB, 质量: ${quality.toFixed(1)}`);
        resolve(result);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function removeImage() {
  imagePreview.value = null;
  emit('update:imageBase64', null);
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}
</script>

<style scoped>
.image-uploader {
  display: flex;
  align-items: center;
}

.upload-area {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glass);
  border: 1.5px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--text-muted);
}

.upload-area:hover {
  background: white;
  border-color: var(--primary);
  color: var(--primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.icon {
  font-size: 1.25rem;
}

.text {
  display: none; /* 在聊天栏紧凑显示时隐藏文字 */
}

.preview-area {
  position: relative;
  display: flex;
  align-items: center;
  padding: 4px;
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1.5px solid var(--primary-glow);
}

.preview-area img {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.btn-remove {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: #ef4444;
  color: white;
  border: 2px solid white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  transition: all 0.2s;
}

.btn-remove:hover {
  transform: scale(1.1);
  filter: brightness(1.2);
}
</style>
