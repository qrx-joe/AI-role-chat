const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function takeScreenshots() {
  await ensureDir(SCREENSHOT_DIR);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  // ===== 截图1: 角色面板 =====
  console.log('📸 截图1: 角色面板...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'role-panel.png'),
    fullPage: false,
  });
  console.log('   ✓ role-panel.png');

  // ===== 截图2: 点击角色进入对话，展示已有对话历史 =====
  console.log('📸 截图2: 多模态对话...');

  // 点击第一个非"创建角色"的角色卡片
  const cards = await page.locator('.role-card').all();
  let clicked = false;
  for (const card of cards) {
    const text = await card.textContent();
    if (text && !text.includes('唤醒新角色')) {
      await card.click();
      clicked = true;
      break;
    }
  }

  if (!clicked) {
    console.log('   ⚠ 没有找到可点击的角色');
    await browser.close();
    return;
  }

  // 等待对话页面加载（消息列表或空状态出现）
  await page.waitForSelector('.chat-container', { timeout: 10000 });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'chat-multimodal.png'),
    fullPage: false,
  });
  console.log('   ✓ chat-multimodal.png');

  // ===== 截图3: 流式响应（发送新消息并在生成中截图） =====
  console.log('📸 截图3: 流式响应...');

  const textarea = page.locator('textarea').first();
  await textarea.waitFor({ timeout: 10000 });
  await textarea.fill('用一句话总结程序员的特点');

  const sendBtn = page.locator('button.send-btn').first();
  await sendBtn.click();

  // 等待流式响应开始（按钮变 disabled）
  try {
    await page.waitForFunction(() => {
      const btn = document.querySelector('button.send-btn');
      return btn && btn.disabled;
    }, { timeout: 8000 });

    // 等待一小段时间让内容开始输出
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log('   ⚠ 流式响应检测超时，截取当前状态');
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'streaming.png'),
    fullPage: false,
  });
  console.log('   ✓ streaming.png');

  await browser.close();
  console.log('\n🎉 所有截图完成！保存在 docs/screenshots/');
}

takeScreenshots().catch(err => {
  console.error('截图失败:', err.message);
  process.exit(1);
});
