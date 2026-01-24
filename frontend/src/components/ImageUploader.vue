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
      <span class="icon">📷</span>
      <span class="text">上传图片</span>
    </div>

    <div v-else class="preview-area">
      <img :src="imagePreview" alt="Preview" />
      <button class="btn-remove" @click.stop="removeImage">✕</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['update:imageBase64']);

const fileInput = ref(null);
const imagePreview = ref(null);
const imageBase64 = ref(null);

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

  // 检查文件大小（5MB）
  if (file.size > 5 * 1024 * 1024) {
    alert('图片大小不能超过 5MB');
    return;
  }

  try {
    // Canvas 压缩
    const compressed = await compressImage(file);
    imagePreview.value = compressed;
    imageBase64.value = compressed;
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

        // 限制最大尺寸
        const maxSize = 1920;
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

        // 压缩质量
        let quality = 0.8;
        let result = canvas.toDataURL('image/jpeg', quality);

        // 如果还是太大，继续压缩
        while (result.length > 1024 * 1024 && quality > 0.5) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }

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
  imageBase64.value = null;
  emit('update:imageBase64', null);
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}
</script>

<style scoped>
.image-uploader {
  display: inline-block;
}

.upload-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px dashed #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.icon {
  font-size: 20px;
}

.text {
  font-size: 14px;
  color: #666;
}

.preview-area {
  position: relative;
  display: inline-block;
}

.preview-area img {
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.btn-remove {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background 0.3s;
}

.btn-remove:hover {
  background: rgba(0, 0, 0, 0.8);
}
</style>
