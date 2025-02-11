import { API } from './modules/api.js';
import { loadSettings, saveSettings, getRandomInteger, SETTINGS_STORAGE_KEY } from './modules/utils.js';

/**
 * 変数命名規約
 * 
 * 1. プロパティ名
 *   - xxxKeys: キー名のリストを示す場合は、対象を示す接頭辞 + Keys
 *   - xxxList: 表示用のリストデータを示す場合は、対象を示す接頭辞 + List
 *   - xxxMap: キーと値のマッピングを示す場合は、対象を示す接頭辞 + Map
 *   - xxxId: 一意の識別子を示す場合は、対象を示す接頭辞 + Id
 *   - xxxIndex: インデックス番号を示す場合は、対象を示す接頭辞 + Index
 *   - xxxCount: カウント数を示す場合は、対象を示す接頭辞 + Count
 *   - xxxTimer: タイマーIDを示す場合は、対象を示す接頭辞 + Timer
 *   - xxxTimestamp: タイムスタンプを示す場合は、対象を示す接頭辞 + Timestamp
 * 
 * 2. メソッド名
 *   - initialize〜: 初期化処理を示す場合は initialize で開始
 *   - handle〜: イベントハンドラを示す場合は handle で開始
 *   - update〜: 更新処理を示す場合は update で開始
 *   - navigate〜: 画面遷移を示す場合は navigate で開始
 */

class App {
    constructor() {
        this.settings = loadSettings();
        this.api = new API(this.settings);
        this.lastQueueTimestamp = 0;
        this.queueCheckTimer = null;
        this.queueTotalCount = 0;
        this.currentImageIndex = 0;
        this.imageList = [];
        this.queueImageMap = {};
        this.queueIdList = [];
        this.currentQueueId = null;
        this.initializeForm();
        this.initializeFileUpload();
        this.initializePromptEditModal();
        this.loadGallery();
        this.startQueueMonitoring();
        this.initializeImageModal();
    }

    // ギャラリー表示用メソッドを追加
    async loadGallery() {
        try {
            // ローディングトーストを表示
            const loadingToast = document.getElementById('loadingToast');
            const toast = new bootstrap.Toast(loadingToast, { autohide: false });
            toast.show();

            const history = await this.api.getHistory();
            const article = document.querySelector('article');
            article.innerHTML = ''; // historyの取得完了後にクリア

            // セクションタイトルを追加
            const galleryTitle = document.createElement('h2');
            galleryTitle.className = 'mb-4';
            galleryTitle.textContent = 'Generated History';
            article.appendChild(galleryTitle);

            // Queue IDの配列を更新
            this.queueIdList = Object.keys(history).reverse();
            this.queueImageMap = {};

            for (const [queueId, item] of Object.entries(history).reverse()) {
                // Queue IDごとの画像URLを収集
                const imagesInPrompt = [];

                // 出力された画像を事前にチェック
                let hasImages = false;
                for (const [nodeId, output] of Object.entries(item.outputs)) {
                    if (output.images) {
                        output.images.forEach(image => {
                            if (image.subfolder !== 'http_image_cache') {
                                hasImages = true;
                            }
                        });
                    }
                }

                // 画像がない場合はスキップ
                if (!hasImages) {
                    continue;
                }

                // プロンプトグループのコンテナを作成
                const promptGroup = document.createElement('div');
                promptGroup.className = 'card mb-4';

                const prompt = item.prompt[2];
                promptGroup.dataset.prompt = encodeURIComponent(JSON.stringify(prompt));

                // プロンプトの情報を表示するヘッダー部分
                const header = document.createElement('div');
                header.className = 'card-header';
                
                header.innerHTML = `
                    <h5 class="mb-0">Queue ID: ${queueId}</h5>
                    <div class="mt-2">
                        <button class="btn btn-sm btn-primary generate-button">Generate</button>
                        <button class="btn btn-sm btn-success regenerate-button">Regenerate</button>
                    </div>
                `;
                promptGroup.appendChild(header);

                // Regenerateボタンのイベントハンドラを設定
                const regenerateButton = header.querySelector('.regenerate-button');
                regenerateButton.addEventListener('click', async () => {
                    await this.handleRegenerate(regenerateButton, promptGroup);
                });

                // Generateボタンのイベントハンドラを設定
                const generateButton = header.querySelector('.generate-button');
                generateButton.addEventListener('click', async () => {
                    await this.handleGenerate(generateButton, promptGroup);
                });

                // 画像ギャラリー部分
                const gallery = document.createElement('div');
                gallery.className = 'card-body';
                const imageContainer = document.createElement('div');
                imageContainer.className = 'row g-2';

                // 出力された画像を表示
                for (const [nodeId, output] of Object.entries(item.outputs)) {
                    if (output.images) {
                        output.images.forEach(image => {
                            if (image.subfolder === 'http_image_cache') {
                                return;
                            }

                            const imageUrl = `${this.settings.origin}api/view?filename=${image.filename}&subfolder=${image.subfolder}&type=${image.type}`;
                            imagesInPrompt.push(imageUrl);

                            const col = document.createElement('div');
                            col.className = 'col-6 col-md-3';
                            
                            const imgWrapper = document.createElement('div');
                            imgWrapper.className = 'card h-100';
                            
                            const img = document.createElement('img');
                            img.src = imageUrl;
                            img.className = 'card-img-top';
                            img.alt = image.filename;

                            // クリックイベントを追加
                            img.addEventListener('click', () => {
                                this.imageList = imagesInPrompt;
                                this.currentImageIndex = imagesInPrompt.indexOf(imageUrl);
                                this.currentQueueId = queueId;
                                const modalImage = document.getElementById('modalImage');
                                modalImage.src = imageUrl;
                                this.updateImageCounter();
                                const modal = new bootstrap.Modal(document.getElementById('imageModal'));
                                modal.show();
                            });

                            imgWrapper.appendChild(img);
                            col.appendChild(imgWrapper);
                            imageContainer.appendChild(col);
                        });
                    }
                }

                // Queue IDごとの画像URLを保存
                this.queueImageMap[queueId] = imagesInPrompt;

                gallery.appendChild(imageContainer);
                promptGroup.appendChild(gallery);
                article.appendChild(promptGroup);
            }

            // ローディングトーストを非表示
            toast.hide();
        } catch (error) {
            console.error('ギャラリー読み込みエラー:', error);
            // ローディングトーストを非表示
            const loadingToast = bootstrap.Toast.getInstance(document.getElementById('loadingToast'));
            if (loadingToast) loadingToast.hide();

            const article = document.querySelector('article');
            article.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    ギャラリーの読み込みに失敗しました: ${error.message}
                </div>
            `;
        }
    }

    // キュー監視を開始するメソッド
    startQueueMonitoring() {
        // 初回実行
        this.checkQueueStatus();
        
        // インターバルを0にして連続的にチェック
        this.queueCheckTimer = setInterval(() => {
            const now = Date.now();
            const elapsed = now - this.lastQueueTimestamp;
            
            // 前回の実行から規定の時間が経過している場合のみ実行
            if (elapsed >= this.settings.retryInterval) {
                this.checkQueueStatus();
            }
        }, 0);
    }

    // キューの状態を確認するメソッド
    async checkQueueStatus() {
        try {
            this.lastQueueTimestamp = Date.now(); // 実行時刻を記録
            const response = await this.api.getQueueStatus();
            
            // バッジの要素を取得
            const runningBadge = document.getElementById('queueRunningBadge');
            const pendingBadge = document.getElementById('queuePendingBadge');
            
            // 実行中のキューの状態を更新
            const runningCount = response.queue_running.length;
            if (runningCount > 0) {
                runningBadge.textContent = runningCount;
                runningBadge.classList.remove('d-none');
            } else {
                runningBadge.classList.add('d-none');
            }
            
            // 待機中のキューの状態を更新
            const pendingCount = response.queue_pending.length;
            if (pendingCount > 0) {
                pendingBadge.textContent = pendingCount;
                pendingBadge.classList.remove('d-none');
            } else {
                pendingBadge.classList.add('d-none');
            }

            // 現在のキュー合計数を計算
            const currentTotalCount = runningCount + pendingCount;

            // キューが1以上から0になった場合、ギャラリーを更新
            if (this.queueTotalCount > 0 && currentTotalCount === 0) {
                await this.loadGallery();
            }
            // 合計数を更新
            this.queueTotalCount = currentTotalCount;

        } catch (error) {
            console.error('キュー状態確認エラー:', error);
        }
    }

    initializeForm() {
        // フォームに設定値を反映
        const form = document.getElementById('settingsForm');
        const testQueueStatusButton = document.getElementById('testQueueStatus');
        const testHistoryButton = document.getElementById('testHistory');

        // 通信テストボタンのイベントハンドラを設定
        testQueueStatusButton.addEventListener('click', async () => {
            testQueueStatusButton.disabled = true;
            testQueueStatusButton.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Testing...
            `;
            try {
                const response = await this.api.getQueueStatus();
                console.debug('Queue Status Test Response:', response);
                alert('Queue Status テスト成功');
            } catch (error) {
                console.error('Queue Status Test Error:', error);
                alert('Queue Status テスト失敗');
            } finally {
                testQueueStatusButton.disabled = false;
                testQueueStatusButton.innerHTML = 'Queue Status';
            }
        });

        testHistoryButton.addEventListener('click', async () => {
            testHistoryButton.disabled = true;
            testHistoryButton.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Testing...
            `;
            try {
                const response = await this.api.getHistory();
                console.debug('History Test Response:', response);
                alert('History テスト成功');
            } catch (error) {
                console.error('History Test Error:', error);
                alert('History テスト失敗');
            } finally {
                testHistoryButton.disabled = false;
                testHistoryButton.innerHTML = 'History';
            }
        });

        for (const [key, value] of Object.entries(this.settings)) {
            const input = document.getElementById(key);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = value;
                } else {
                    input.value = value;
                }
            }
        }

        // フォームの送信イベントを処理
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const newSettings = {};
            for (const input of form.elements) {
                if (input.id) {
                    if (input.type === 'number') {
                        newSettings[input.id] = parseInt(input.value, 10);
                    } else {
                        newSettings[input.id] = input.type === 'checkbox' ? input.checked : input.value;
                    }
                }
            }
            this.settings = newSettings;
            saveSettings(newSettings);
            
            // APIインスタンスを新しい設定で再作成
            this.api = new API(newSettings);

            // 保存完了を通知
            alert('設定を保存しました');
        });
    }

    // 画像モーダルの初期化
    initializeImageModal() {
        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        const prevButton = document.getElementById('prevImage');
        const nextButton = document.getElementById('nextImage');
        const modalBody = modal.querySelector('.modal-body');

        prevButton.addEventListener('click', () => this.navigateImage(-1));
        nextButton.addEventListener('click', () => this.navigateImage(1));

        // 画像以外の領域クリックでモーダルを閉じる
        modalBody.addEventListener('click', (e) => {
            if (e.target === modalBody) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                modalInstance.hide();
            }
        });

        // 画像クリックのイベント伝播を停止
        modalImage.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        document.addEventListener('keydown', (e) => {
            if (modal.classList.contains('show')) {
                switch (e.key) {
                    case 'ArrowLeft':
                        this.navigateImage(-1);
                        break;
                    case 'ArrowRight':
                        this.navigateImage(1);
                        break;
                    case 'ArrowUp':
                        this.navigateQueue(-1);
                        break;
                    case 'ArrowDown':
                        this.navigateQueue(1);
                        break;
                }
            }
        });
    }

    // 画像ナビゲーション
    navigateImage(direction) {
        this.currentImageIndex = (this.currentImageIndex + direction + this.imageList.length) % this.imageList.length;
        const modalImage = document.getElementById('modalImage');
        modalImage.src = this.imageList[this.currentImageIndex];
        this.updateImageCounter();
    }

    // Queue間の移動を処理
    navigateQueue(direction) {
        const currentIndex = this.queueIdList.indexOf(this.currentQueueId);
        const newIndex = (currentIndex + direction + this.queueIdList.length) % this.queueIdList.length;
        const newQueueId = this.queueIdList[newIndex];
        
        // 新しいQueueの画像を設定
        this.currentQueueId = newQueueId;
        this.imageList = this.queueImageMap[newQueueId];
        this.currentImageIndex = 0; // 新しいQueueの最初の画像を表示
        
        const modalImage = document.getElementById('modalImage');
        modalImage.src = this.imageList[this.currentImageIndex];
        this.updateImageCounter();
    }

    // 画像カウンターの更新
    updateImageCounter() {
        const modalTitle = document.querySelector('#imageModal .modal-title');
        modalTitle.textContent = `Image View (${this.currentImageIndex + 1}/${this.imageList.length})`;
    }

    // シード値を置換する関数
    replaceSeedValues(prompt) {
        if (!this.settings.autoRandomizeSeed) {
            return prompt;
        }

        const newPrompt = JSON.parse(JSON.stringify(prompt));
        const seedKeys = this.settings.seedKeyPatterns.split(',').map(key => key.trim());

        for (const [nodeId, node] of Object.entries(newPrompt)) {
            if (node.inputs) {
                for (const [key, value] of Object.entries(node.inputs)) {
                    if (seedKeys.includes(key) && typeof value === 'number') {
                        console.debug('Replace seed value:', key, value);
                        node.inputs[key] = getRandomInteger();
                    }
                }
            }
        }
        return newPrompt;
    }

    // 編集可能なフォーム要素を探す
    findEditableForms(prompt, patterns, type) {
        const editableForms = [];
        const keys = patterns.split(',').map(key => key.trim());
        for (const [nodeId, node] of Object.entries(prompt)) {
            if (node.inputs) {
                for (const [key, value] of Object.entries(node.inputs)) {
                    if (keys.includes(key) && typeof value === type) {
                        editableForms.push({
                            nodeId,
                            key,
                            value,
                            node,
                            path: `${nodeId}.inputs.${key}`
                        });
                    }
                }
            }
        }
        return editableForms;
    }

    // 編集フォームを生成
    createPromptEditForm(editableForms) {
        const form = document.getElementById('promptEditForm');
        form.innerHTML = ''; // フォームをクリア

        // ノードのタイトルを取得する関数
        const getNodeTitle = (node) => {
            return node._meta?.title || node.class_type;
        };

        // テキストエリアフォーム
        editableForms.textarea.forEach(formItem => {
            const div = document.createElement('div');
            div.className = 'mb-3';

            const label = document.createElement('label');
            label.className = 'form-label';
            label.htmlFor = `form-${formItem.nodeId}-${formItem.key}`;
            label.textContent = `${getNodeTitle(formItem.node)} (${formItem.key})`;

            const textarea = document.createElement('textarea');
            textarea.className = 'form-control';
            textarea.id = `form-${formItem.nodeId}-${formItem.key}`;
            textarea.rows = 5;
            textarea.value = formItem.value;

            div.appendChild(label);
            div.appendChild(textarea);
            form.appendChild(div);
        });

        // 単一行テキスト入力フォーム
        editableForms.input.forEach(formItem => {
            const div = document.createElement('div');
            div.className = 'mb-3';

            const label = document.createElement('label');
            label.className = 'form-label';
            label.htmlFor = `form-${formItem.nodeId}-${formItem.key}`;
            label.textContent = `${getNodeTitle(formItem.node)} (${formItem.key})`;

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-control';
            input.id = `form-${formItem.nodeId}-${formItem.key}`;
            input.value = formItem.value;

            div.appendChild(label);
            div.appendChild(input);
            form.appendChild(div);
        });

        // 数値入力フォーム（integer）
        editableForms.integer.forEach(formItem => {
            const div = document.createElement('div');
            div.className = 'mb-3';

            const label = document.createElement('label');
            label.className = 'form-label';
            label.htmlFor = `form-${formItem.nodeId}-${formItem.key}`;
            label.textContent = `${getNodeTitle(formItem.node)} (${formItem.key})`;

            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'form-control';
            input.id = `form-${formItem.nodeId}-${formItem.key}`;
            input.value = formItem.value;
            input.step = '1';

            div.appendChild(label);
            div.appendChild(input);
            form.appendChild(div);
        });

        // 数値入力フォーム（float）
        editableForms.float.forEach(formItem => {
            const div = document.createElement('div');
            div.className = 'mb-3';

            const label = document.createElement('label');
            label.className = 'form-label';
            label.htmlFor = `form-${formItem.nodeId}-${formItem.key}`;
            label.textContent = `${getNodeTitle(formItem.node)} (${formItem.key})`;

            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'form-control';
            input.id = `form-${formItem.nodeId}-${formItem.key}`;
            input.value = formItem.value;
            input.step = '0.1';

            div.appendChild(label);
            div.appendChild(input);
            form.appendChild(div);
        });
    }

    // プロンプト編集用のモーダルを初期化
    initializePromptEditModal() {
        const modal = document.getElementById('promptEditModal');
        const saveButton = document.getElementById('savePromptButton');
        const form = document.getElementById('promptEditForm');

        this.promptEditModal = new bootstrap.Modal(modal);
        this.currentPromptData = null;
        this.currentPromptButton = null;
        this.editableForms = {
            textarea: [],
            input: [],
            integer: [],
            float: []
        };

        saveButton.addEventListener('click', async () => {
            const updatedForms = {
                textarea: this.editableForms.textarea.map(form => ({
                    path: form.path,
                    value: document.getElementById(`form-${form.nodeId}-${form.key}`).value
                })),
                input: this.editableForms.input.map(form => ({
                    path: form.path,
                    value: document.getElementById(`form-${form.nodeId}-${form.key}`).value
                })),
                integer: this.editableForms.integer.map(form => ({
                    path: form.path,
                    value: parseInt(document.getElementById(`form-${form.nodeId}-${form.key}`).value)
                })),
                float: this.editableForms.float.map(form => ({
                    path: form.path,
                    value: parseFloat(document.getElementById(`form-${form.nodeId}-${form.key}`).value)
                }))
            };
            await this.executeGenerate(this.currentPromptButton, this.currentPromptData, updatedForms);
            this.promptEditModal.hide();
        });

        // 設定初期化ボタンのイベントハンドラ
        document.getElementById('resetSettings').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all settings to default?')) {
                localStorage.removeItem(SETTINGS_STORAGE_KEY);
                location.reload();
            }
        });
    }

    // Generateボタンの処理
    async handleGenerate(button, promptGroup) {
        const promptData = JSON.parse(decodeURIComponent(promptGroup.dataset.prompt));
        const editableForms = {
            textarea: this.findEditableForms(promptData, this.settings.textareaKeyPatterns, "string"),
            input: this.findEditableForms(promptData, this.settings.inputKeyPatterns, "string"),
            integer: this.findEditableForms(promptData, this.settings.integerKeyPatterns, "number"),
            float: this.findEditableForms(promptData, this.settings.floatKeyPatterns, "number")
        };
        
        if (Object.values(editableForms).some(forms => forms.length > 0)) {
            this.editableForms = editableForms;
            this.createPromptEditForm(editableForms);
            this.currentPromptData = promptData;
            this.currentPromptButton = button;
            this.promptEditModal.show();
        } else {
            // 編集可能なフォームが見つからない場合はその旨を通知
            const noEditableFormsToast = document.createElement('div');
            noEditableFormsToast.className = 'toast';
            noEditableFormsToast.setAttribute('role', 'alert');
            noEditableFormsToast.setAttribute('aria-live', 'assertive');
            noEditableFormsToast.setAttribute('aria-atomic', 'true');
            noEditableFormsToast.innerHTML = `
                <div class="toast-body d-flex align-items-center text-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No editable forms found. Generating with the same settings.
                </div>
            `;
            document.querySelector('.toast-container').appendChild(noEditableFormsToast);
            const toast = new bootstrap.Toast(noEditableFormsToast, { delay: 3000 });
            toast.show();

            // トースト要素の削除
            noEditableFormsToast.addEventListener('hidden.bs.toast', () => {
                noEditableFormsToast.remove();
            });

            // 通常のGenerate処理を実行
            await this.executeGenerate(button, promptData);
        }
    }

    // Regenerateボタンの処理
    async handleRegenerate(button, promptGroup) {
        const promptData = JSON.parse(decodeURIComponent(promptGroup.dataset.prompt));
        await this.executeGenerate(button, promptData);
    }

    // 実際のGenerate処理
    async executeGenerate(button, promptData, updatedForms = null) {
        // 生成中のトーストを作成
        const generatingToast = document.createElement('div');
        generatingToast.className = 'toast';
        generatingToast.setAttribute('role', 'alert');
        generatingToast.setAttribute('aria-live', 'assertive');
        generatingToast.setAttribute('aria-atomic', 'true');
        generatingToast.innerHTML = `
            <div class="toast-body d-flex align-items-center">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                プロンプトをキューに追加中...
            </div>
        `;
        document.querySelector('.toast-container').appendChild(generatingToast);
        const toast = new bootstrap.Toast(generatingToast, { autohide: false });
        toast.show();

        if (button) {
            button.disabled = true;
            button.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Queueing...
            `;
        }
        
        try {
            let newPromptData = this.replaceSeedValues(promptData);
            
            // プロンプトテキストの更新
            if (updatedForms) {
                // 各タイプのフォーム値を更新
                ['textarea', 'input', 'integer', 'float'].forEach(type => {
                    if (updatedForms[type]) {
                        updatedForms[type].forEach(({ path, value }) => {
                            const pathParts = path.split('.');
                            let target = newPromptData;
                            for (let i = 0; i < pathParts.length - 1; i++) {
                                target = target[pathParts[i]];
                            }
                            target[pathParts[pathParts.length - 1]] = value;
                        });
                    }
                });
            }
            
            await this.api.postPrompt(newPromptData);
            
            // 成功時のトースト表示
            generatingToast.innerHTML = `
                <div class="toast-body d-flex align-items-center text-success">
                    <i class="fas fa-check-circle me-2"></i>
                    プロンプトをキューに追加しました
                </div>
            `;
            setTimeout(() => {
                toast.hide();
                generatingToast.remove();
            }, 3000);

        } catch (error) {
            console.error('Generate error:', error);
            
            // エラー時のトースト表示
            generatingToast.innerHTML = `
                <div class="toast-body d-flex align-items-center text-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    キューの作成に失敗しました: ${error.message}
                </div>
            `;
            setTimeout(() => {
                toast.hide();
                generatingToast.remove();
            }, 5000);

        } finally {
            if (button) {
                button.disabled = false;
                button.innerHTML = button.classList.contains('regenerate-button') ? 'Regenerate' : 'Generate';
            }
        }
    }

    // JSONファイルアップロード機能の初期化
    initializeFileUpload() {
        const fileInput = document.getElementById('jsonFileInput');
        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const promptData = JSON.parse(text);
                const editableForms = {
                    textarea: this.findEditableForms(promptData, this.settings.textareaKeyPatterns, "string"),
                    input: this.findEditableForms(promptData, this.settings.inputKeyPatterns, "string"),
                    integer: this.findEditableForms(promptData, this.settings.integerKeyPatterns, "number"),
                    float: this.findEditableForms(promptData, this.settings.floatKeyPatterns, "number")
                };
                
                if (Object.values(editableForms).some(forms => forms.length > 0)) {
                    this.editableForms = editableForms;
                    this.createPromptEditForm(this.editableForms);
                    this.currentPromptData = promptData;
                    this.currentPromptButton = null; // ボタンは存在しないのでnull
                    this.promptEditModal.show();
                } else {
                    // 編集可能なフォームが見つからない場合は直接実行
                    await this.executeGenerate(null, promptData);
                }

                fileInput.value = ''; // ファイル選択をクリア
            } catch (error) {
                console.error('File upload error:', error);
                alert('JSONファイルの処理に失敗しました');
                fileInput.value = ''; // エラー時もファイル選択をクリア
            }
        });
    }
}

import { app } from "../../scripts/app.js";
// アプリケーションの起動
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('comfyui-mobile-client')) {
        const mobileClient = new App();
    }else{
        console.log(app.graph._nodes);
    }
});
