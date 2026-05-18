import sys
import os
# 将 backend 目录加入系统路径，以便导入解析器
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from PySide6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                               QHBoxLayout, QPushButton, QTextBrowser, QFileDialog, 
                               QLabel, QSplitter, QFrame, QGraphicsDropShadowEffect,
                               QStackedWidget, QGridLayout, QScrollArea, QListWidget,
                               QListWidgetItem)
from PySide6.QtCore import Qt, QSize
from PySide6.QtGui import QFont, QColor, QIcon, QPixmap

from backend.app.services.parser.pdf_parser import PDFParser

class SmartReadApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("智阅 (SmartRead) - 智能阅读器")
        self.resize(1200, 800)
        
        # 模拟数据库：书籍列表与分组
        self.books_db = [
            {"id": 1, "title": "资本论 (节选)", "author": "马克思", "group": "哲学与政治", "cover_color": "#2C3E50"},
            {"id": 2, "title": "人类简史", "author": "尤瓦尔·赫拉利", "group": "历史", "cover_color": "#E67E22"},
            {"id": 3, "title": "三体", "author": "尤瓦尔·赫拉利", "group": "历史", "cover_color": "#8E44AD"},
            {"id": 4, "title": "深度学习", "author": "Ian Goodfellow", "group": "计算机科学", "cover_color": "#27AE60"},
            {"id": 5, "title": "百年孤独", "author": "加西亚·马尔克斯", "group": "文学", "cover_color": "#C0392B"},
        ]
        
        self.current_text = ""
        
        self.init_ui()
        self.apply_stylesheet()

    def init_ui(self):
        # 主部件使用 QStackedWidget 来切换 书架 和 阅读器
        self.stacked_widget = QStackedWidget()
        self.setCentralWidget(self.stacked_widget)
        
        # 1. 初始化书架界面
        self.init_bookshelf_ui()
        
        # 2. 初始化阅读器界面
        self.init_reader_ui()
        
        # 默认显示书架
        self.stacked_widget.setCurrentIndex(0)

    def init_bookshelf_ui(self):
        """初始化类似微信读书的书架界面"""
        bookshelf_widget = QWidget()
        bookshelf_widget.setObjectName("bookshelfWidget")
        layout = QHBoxLayout(bookshelf_widget)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)
        
        # --- 左侧：分组导航栏 ---
        sidebar = QWidget()
        sidebar.setObjectName("bookshelfSidebar")
        sidebar.setFixedWidth(220)
        sidebar_layout = QVBoxLayout(sidebar)
        sidebar_layout.setContentsMargins(20, 40, 20, 20)
        
        logo_label = QLabel("📚 智阅 SmartRead")
        logo_label.setObjectName("logoLabel")
        
        self.group_list = QListWidget()
        self.group_list.setObjectName("groupList")
        groups = ["全部书籍", "哲学与政治", "历史", "计算机科学", "文学"]
        for group in groups:
            item = QListWidgetItem(group)
            # 模拟图标
            if group == "全部书籍":
                item.setIcon(QIcon.fromTheme("folder"))
            self.group_list.addItem(item)
        
        self.group_list.setCurrentRow(0)
        self.group_list.itemClicked.connect(self.filter_books)
        
        btn_add_book = QPushButton("➕ 导入本地书籍")
        btn_add_book.setObjectName("btnAddBook")
        btn_add_book.clicked.connect(self.load_file_to_bookshelf)
        
        sidebar_layout.addWidget(logo_label)
        sidebar_layout.addSpacing(30)
        sidebar_layout.addWidget(self.group_list)
        sidebar_layout.addWidget(btn_add_book)
        
        # --- 右侧：书籍网格展示区 ---
        main_area = QWidget()
        main_area.setObjectName("bookshelfMainArea")
        main_layout = QVBoxLayout(main_area)
        main_layout.setContentsMargins(40, 40, 40, 40)
        
        self.lbl_current_group = QLabel("全部书籍")
        self.lbl_current_group.setObjectName("groupTitle")
        
        # 滚动区域
        scroll_area = QScrollArea()
        scroll_area.setWidgetResizable(True)
        scroll_area.setFrameShape(QFrame.NoFrame)
        scroll_area.setStyleSheet("background-color: transparent;")
        
        self.grid_widget = QWidget()
        self.grid_widget.setStyleSheet("background-color: transparent;")
        self.grid_layout = QGridLayout(self.grid_widget)
        self.grid_layout.setSpacing(30)
        self.grid_layout.setAlignment(Qt.AlignTop | Qt.AlignLeft)
        
        scroll_area.setWidget(self.grid_widget)
        
        main_layout.addWidget(self.lbl_current_group)
        main_layout.addSpacing(20)
        main_layout.addWidget(scroll_area)
        
        # 组装书架
        layout.addWidget(sidebar)
        layout.addWidget(main_area)
        
        self.stacked_widget.addWidget(bookshelf_widget)
        
        # 渲染初始书籍
        self.render_books("全部书籍")

    def render_books(self, group_filter):
        """在网格中渲染书籍封面"""
        # 清空现有网格
        for i in reversed(range(self.grid_layout.count())): 
            self.grid_layout.itemAt(i).widget().setParent(None)
            
        row, col = 0, 0
        max_cols = 4 # 每行最多4本书
        
        for book in self.books_db:
            if group_filter != "全部书籍" and book["group"] != group_filter:
                continue
                
            # 书籍卡片容器
            book_card = QFrame()
            book_card.setObjectName("bookCard")
            book_card.setFixedSize(160, 260)
            card_layout = QVBoxLayout(book_card)
            card_layout.setContentsMargins(10, 10, 10, 10)
            
            # 模拟封面
            cover = QLabel()
            cover.setFixedSize(140, 190)
            cover.setStyleSheet(f"background-color: {book['cover_color']}; border-radius: 6px;")
            cover.setAlignment(Qt.AlignCenter)
            
            # 封面上的文字
            cover_text = QLabel(book["title"][:4])
            cover_text.setStyleSheet("color: white; font-size: 24px; font-weight: bold; background: transparent;")
            cover_text.setAlignment(Qt.AlignCenter)
            
            cover_layout = QVBoxLayout(cover)
            cover_layout.addWidget(cover_text)
            
            # 添加阴影
            shadow = QGraphicsDropShadowEffect()
            shadow.setBlurRadius(15)
            shadow.setColor(QColor(0, 0, 0, 40))
            shadow.setOffset(0, 5)
            cover.setGraphicsEffect(shadow)
            
            # 书名和作者
            title = QLabel(book["title"])
            title.setObjectName("bookCardTitle")
            author = QLabel(book["author"])
            author.setObjectName("bookCardAuthor")
            
            card_layout.addWidget(cover)
            card_layout.addWidget(title)
            card_layout.addWidget(author)
            
            # 点击事件：进入阅读器
            book_card.mousePressEvent = lambda event, b=book: self.open_book(b)
            
            self.grid_layout.addWidget(book_card, row, col)
            
            col += 1
            if col >= max_cols:
                col = 0
                row += 1

    def filter_books(self, item):
        group = item.text()
        self.lbl_current_group.setText(group)
        self.render_books(group)

    def open_book(self, book):
        """从书架打开书籍，进入阅读器界面"""
        self.lbl_reader_title.setText(f"当前阅读：{book['title']}")
        
        # 模拟加载内容
        if "资本论" in book["title"]:
            self.load_sample_text()
        else:
            self.current_text = f"这是《{book['title']}》的内容...\n\n(当前为模拟数据，请点击左上角返回书架，或点击右侧导入真实TXT文件)"
            self.render_text(self.current_text)
            
        self.stacked_widget.setCurrentIndex(1) # 切换到阅读器

    def init_reader_ui(self):
        """初始化阅读器界面 (复用之前的极美 UI)"""
        reader_widget = QWidget()
        reader_widget.setObjectName("readerWidget")
        main_layout = QHBoxLayout(reader_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)
        
        splitter = QSplitter(Qt.Horizontal)
        splitter.setObjectName("mainSplitter")
        main_layout.addWidget(splitter)
        
        # ================= 左侧：阅读区 =================
        left_widget = QWidget()
        left_widget.setObjectName("leftWidget")
        left_layout = QVBoxLayout(left_widget)
        left_layout.setContentsMargins(40, 20, 40, 40)
        
        # 顶部导航栏 (返回按钮 + 标题)
        top_nav = QHBoxLayout()
        btn_back = QPushButton("◀ 返回书架")
        btn_back.setObjectName("btnBack")
        btn_back.clicked.connect(lambda: self.stacked_widget.setCurrentIndex(0))
        
        self.lbl_reader_title = QLabel("当前阅读：资本论 (节选)")
        self.lbl_reader_title.setObjectName("bookTitle")
        self.lbl_reader_title.setAlignment(Qt.AlignCenter)
        
        top_nav.addWidget(btn_back)
        top_nav.addStretch()
        top_nav.addWidget(self.lbl_reader_title)
        top_nav.addStretch()
        # 占位平衡
        dummy = QWidget()
        dummy.setFixedWidth(btn_back.sizeHint().width())
        top_nav.addWidget(dummy)
        
        # 阅读器主体 (带阴影的白纸效果)
        self.text_container = QFrame()
        self.text_container.setObjectName("textContainer")
        text_container_layout = QVBoxLayout(self.text_container)
        text_container_layout.setContentsMargins(0, 0, 0, 0)
        
        shadow = QGraphicsDropShadowEffect()
        shadow.setBlurRadius(20)
        shadow.setColor(QColor(0, 0, 0, 20))
        shadow.setOffset(0, 4)
        self.text_container.setGraphicsEffect(shadow)
        
        self.text_browser = QTextBrowser()
        self.text_browser.setObjectName("textBrowser")
        self.text_browser.setOpenExternalLinks(True)
        
        text_container_layout.addWidget(self.text_browser)
        
        left_layout.addLayout(top_nav)
        left_layout.addSpacing(20)
        left_layout.addWidget(self.text_container)
        
        # ================= 右侧：控制面板 (侧边栏) =================
        right_widget = QWidget()
        right_widget.setObjectName("sidebar")
        right_layout = QVBoxLayout(right_widget)
        right_layout.setContentsMargins(25, 40, 25, 40)
        right_layout.setSpacing(15)
        
        sidebar_title = QLabel("智能辅助")
        sidebar_title.setObjectName("sidebarTitle")
        
        self.btn_load = QPushButton("📂 导入本地书籍 (PDF/TXT)")
        self.btn_load.setObjectName("btnPrimary")
        self.btn_load.clicked.connect(self.load_file_to_reader)
        
        self.btn_ai_annotate = QPushButton("✨ AI 深度解析 (当前页)")
        self.btn_ai_annotate.setObjectName("btnAction")
        self.btn_ai_annotate.clicked.connect(self.apply_ai_annotation)
        
        self.btn_mindmap = QPushButton("🗺️ 生成思维导图")
        self.btn_mindmap.setObjectName("btnSecondary")
        
        self.btn_reset = QPushButton("↺ 恢复纯净阅读")
        self.btn_reset.setObjectName("btnSecondary")
        self.btn_reset.clicked.connect(self.reset_text)
        
        self.lbl_status = QLabel("就绪")
        self.lbl_status.setObjectName("statusLabel")
        self.lbl_status.setAlignment(Qt.AlignCenter)
        
        right_layout.addWidget(sidebar_title)
        right_layout.addSpacing(20)
        right_layout.addWidget(self.btn_load)
        right_layout.addWidget(self.btn_ai_annotate)
        right_layout.addWidget(self.btn_mindmap)
        right_layout.addWidget(self.btn_reset)
        right_layout.addStretch()
        right_layout.addWidget(self.lbl_status)
        
        splitter.addWidget(left_widget)
        splitter.addWidget(right_widget)
        splitter.setSizes([850, 350])
        
        self.stacked_widget.addWidget(reader_widget)

    def apply_stylesheet(self):
        """应用现代化的 QSS 样式"""
        self.setStyleSheet("""
            /* 全局背景 */
            QWidget#bookshelfWidget, QWidget#readerWidget, QWidget#leftWidget {
                background-color: #F5F5F7;
            }
            
            /* 书架侧边栏 */
            QWidget#bookshelfSidebar {
                background-color: #EAEAEA;
                border-right: 1px solid #D1D1D6;
            }
            
            QLabel#logoLabel {
                font-size: 20px;
                font-weight: bold;
                color: #1D1D1F;
            }
            
            /* 分组列表 */
            QListWidget#groupList {
                background-color: transparent;
                border: none;
                font-size: 15px;
                color: #3A3A3C;
            }
            QListWidget#groupList::item {
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 4px;
            }
            QListWidget#groupList::item:hover {
                background-color: #D1D1D6;
            }
            QListWidget#groupList::item:selected {
                background-color: #007AFF;
                color: white;
                font-weight: bold;
            }
            
            /* 书架主区域标题 */
            QLabel#groupTitle {
                font-size: 28px;
                font-weight: bold;
                color: #1D1D1F;
            }
            
            /* 书籍卡片 */
            QFrame#bookCard {
                background-color: transparent;
                border-radius: 8px;
            }
            QFrame#bookCard:hover {
                background-color: #E5E5EA;
            }
            QLabel#bookCardTitle {
                font-size: 14px;
                font-weight: bold;
                color: #1D1D1F;
                margin-top: 8px;
            }
            QLabel#bookCardAuthor {
                font-size: 12px;
                color: #86868B;
            }
            
            /* 阅读器标题与返回按钮 */
            QLabel#bookTitle {
                font-size: 20px;
                font-weight: bold;
                color: #1D1D1F;
            }
            QPushButton#btnBack {
                background-color: transparent;
                color: #007AFF;
                font-size: 15px;
                font-weight: bold;
                border: none;
                text-align: left;
            }
            QPushButton#btnBack:hover {
                color: #0056b3;
            }
            
            /* 纸张容器 */
            QFrame#textContainer {
                background-color: #FFFFFF;
                border-radius: 12px;
            }
            
            /* 文本浏览器 */
            QTextBrowser#textBrowser {
                background-color: transparent;
                border: none;
                padding: 40px;
                color: #333333;
            }
            
            /* 阅读器侧边栏 */
            QWidget#sidebar {
                background-color: #FFFFFF;
                border-left: 1px solid #E5E5EA;
            }
            QLabel#sidebarTitle {
                font-size: 18px;
                font-weight: bold;
                color: #1D1D1F;
            }
            
            /* 按钮通用样式 */
            QPushButton {
                font-size: 14px;
                font-weight: 600;
                border-radius: 8px;
                padding: 12px;
                border: none;
            }
            QPushButton#btnAddBook {
                background-color: #FFFFFF;
                color: #1D1D1F;
                border: 1px solid #D1D1D6;
            }
            QPushButton#btnAddBook:hover {
                background-color: #F2F2F7;
            }
            QPushButton#btnPrimary {
                background-color: #000000;
                color: #FFFFFF;
            }
            QPushButton#btnPrimary:hover {
                background-color: #333333;
            }
            QPushButton#btnAction {
                background-color: #007AFF;
                color: #FFFFFF;
            }
            QPushButton#btnAction:hover {
                background-color: #0056b3;
            }
            QPushButton#btnSecondary {
                background-color: #F2F2F7;
                color: #1D1D1F;
            }
            QPushButton#btnSecondary:hover {
                background-color: #E5E5EA;
            }
            
            QLabel#statusLabel {
                color: #86868B;
                font-size: 12px;
            }
            QSplitter::handle {
                background-color: transparent;
            }
        """)

    def load_sample_text(self):
        self.current_text = """各个社会阶层进入革命动荡时，无产阶级就跟它缔结同盟，从而分享了各个政党依次遭受到的失败。但是，这些相继而来的打击，随着它们触及的社会面的扩大，也愈来愈弱了。无产阶级在议会和报刊方面的一些比较杰出的领袖，相继被捕判罪，代替他们的是些愈益模棱两可的人物。无产阶级中有一部分人醉心于教条的实验，醉心于成立交换银行和工人团体，换句话说，醉心于这样一些形式的运动，即放弃利用旧世界本身内的一切强大手段来变革旧世界的思想，却企图躲在社会背后，用私人的办法，在自身生存的有限条件的范围内实现自身的解放，因此必然是要失败的。当六月事变中与无产阶级为敌的一切阶级还没有像无产阶级本身一样倒下的时候..."""
        self.render_text(self.current_text)

    def load_file_to_bookshelf(self):
        """从书架导入书籍 (模拟添加到数据库)"""
        file_name, _ = QFileDialog.getOpenFileName(self, "导入书籍", "", "Supported Files (*.pdf *.txt);;PDF Files (*.pdf);;Text Files (*.txt)")
        if file_name:
            import os
            title = os.path.basename(file_name).split('.')[0]
            new_book = {
                "id": len(self.books_db) + 1,
                "title": title,
                "author": "未知作者",
                "group": "全部书籍",
                "cover_color": "#34495E",
                "file_path": file_name # 记录真实路径
            }
            self.books_db.insert(0, new_book) # 插入到最前面
            self.group_list.setCurrentRow(0)
            self.filter_books(self.group_list.item(0))

    def load_file_to_reader(self):
        """在阅读器内直接导入并阅读"""
        file_name, _ = QFileDialog.getOpenFileName(self, "打开书籍", "", "Supported Files (*.pdf *.txt);;PDF Files (*.pdf);;Text Files (*.txt)")
        if file_name:
            self.process_and_render_file(file_name)

    def open_book(self, book):
        """从书架打开书籍，进入阅读器界面"""
        self.lbl_reader_title.setText(f"当前阅读：{book['title']}")
        
        if "file_path" in book:
            # 如果是真实导入的书籍
            self.process_and_render_file(book["file_path"])
        elif "资本论" in book["title"]:
            self.load_sample_text()
        else:
            self.current_text = f"这是《{book['title']}》的内容...\n\n(当前为模拟数据，请点击左上角返回书架，或点击右侧导入真实书籍)"
            self.render_text(self.current_text)
            
        self.stacked_widget.setCurrentIndex(1) # 切换到阅读器

    def process_and_render_file(self, file_path):
        """处理文件并渲染 (支持 PDF 图文混排 和 TXT)"""
        import os
        self.lbl_reader_title.setText(f"当前阅读：{os.path.basename(file_path)}")
        self.lbl_status.setText("正在解析文件...")
        QApplication.processEvents()
        
        try:
            if file_path.lower().endswith('.pdf'):
                parser = PDFParser(file_path)
                # 默认解析第一页作为演示
                elements = parser.parse_page(0)
                
                html_content = ""
                raw_text_for_ai = ""
                
                for el in elements:
                    if el["type"] == "text":
                        html_content += f"<p style='margin-bottom: 15px; text-indent: 2em;'>{el['content']}</p>"
                        raw_text_for_ai += el['content'] + "\n"
                    elif el["type"] == "image":
                        # 渲染 Base64 图片
                        html_content += f"<div style='text-align: center; margin: 20px 0;'><img src='data:image/{el['ext']};base64,{el['content']}' style='max-width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);' /></div>"
                
                self.current_text = raw_text_for_ai # 保存纯文本供 AI 标注使用
                self.render_html(html_content)
                parser.close()
                
            elif file_path.lower().endswith('.txt'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    self.current_text = f.read()
                self.render_text(self.current_text)
                
            self.lbl_status.setText("文件加载成功")
        except Exception as e:
            self.lbl_status.setText(f"加载失败: {str(e)}")

    def render_text(self, text):
        """渲染纯文本 (自动分段)"""
        paragraphs = text.split('\n')
        html_content = "".join([f"<p style='margin-bottom: 15px; text-indent: 2em;'>{p}</p>" for p in paragraphs if p.strip()])
        self.render_html(html_content)

    def render_html(self, html_content):
        """渲染最终的 HTML 内容"""
        styled_html = f"""
        <div style="
            font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif; 
            font-size: 18px; 
            line-height: 2.0; 
            color: #2C2C2E;
            letter-spacing: 1px;
        ">
            {html_content}
        </div>
        """
        self.text_browser.setHtml(styled_html)

    def reset_text(self):
        self.render_text(self.current_text)
        self.lbl_status.setText("已恢复纯净阅读")

    def apply_ai_annotation(self):
        self.lbl_status.setText("AI 正在深度解析...")
        QApplication.processEvents()
        
        mock_ai_response = [
            {
                "exact_text": "这些相继而来的打击，随着它们触及的社会面的扩大，也愈来愈弱了。",
                "author": "马克思",
                "type": "quote"
            },
            {
                "exact_text": "即放弃利用旧世界本身内的一切强大手段来变革旧世界的思想，却企图躲在社会背后，用私人的办法，在自身生存的有限条件的范围内实现自身的解放，因此必然是要失败的。",
                "author": "马克思",
                "type": "criticism"
            }
        ]
        
        annotated_html = self.current_text
        for item in mock_ai_response:
            exact_text = item["exact_text"]
            author = item["author"]
            styled_text = f"""
            <span style="color: #E74C3C; font-size: 14px; font-weight: bold;">[{author}] </span>
            <span style="border-bottom: 2px solid #E74C3C; padding-bottom: 2px; background-color: rgba(231, 76, 60, 0.05);">{exact_text}</span>
            """
            annotated_html = annotated_html.replace(exact_text, styled_text)
            
        self.render_text(annotated_html)
        self.lbl_status.setText("解析完成")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setAttribute(Qt.AA_UseHighDpiPixmaps)
    window = SmartReadApp()
    window.show()
    sys.exit(app.exec())
