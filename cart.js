const { createApp } = Vue;
// api路徑及個人path
const apiUrl = 'https://vue3-course-api.hexschool.io/v2';
const apiPath = 'fengchiliu';

// 加入Vee需要用的內容 (解構形式)
const { defineRule, Form, Field, ErrorMessage, configure } = VeeValidate;
const { required, email, min, max } = VeeValidateRules;
const { localize, loadLocaleFromURL } = VeeValidateI18n;

// 加入 Vee 驗證規則
defineRule('required', required);
defineRule('email', email);
defineRule('min', min);
defineRule('max', max);

//  ### 加入繁體中文 ###
//  讀取外部的資源
loadLocaleFromURL('https://unpkg.com/@vee-validate/i18n@4.1.0/dist/locale/zh_TW.json');
configure({
  generateMessage: VeeValidateI18n.localize('zh_TW'),
  validateOnInput: true,    // 調整為：輸入文字時，就立即進行驗證
});

const app = createApp({
    data(){
        return{
            cartData:{},
            products:[],
            productId:'',
            isLoadingItem: '', // 讀取效果用(特定的小按鈕上)
            form:{
                user:{
                    name: '',
                    email: '',
                    tel: '',
                    address: '',
                    text:'',
                },
            },
            // 需先預設 carts 的陣列才能使用 length 方法，畫面在一開始渲染之前會先抓data內的資料，因為抓不到所以會噴錯
            cartData:{
                carts:[]    // 這邊也可在 HTML 使用 "?."的方式 -> cartData.carts?.length === 0
            }
        }
    },
    methods:{
        getProducts(){
            axios.get(`${apiUrl}/api/${apiPath}/products/all`)
                .then((res)=>{
                    console.log('getProducts:', res);
                    this.products = res.data.products       // 抓取傳回的資料
            })
        },
        openProductModal(id){
            this.productId = id;
            this.$refs.productModal.openModal();
        },
        getCart(){
            axios.get(`${apiUrl}/api/${apiPath}/cart`)
                .then((res)=>{
                    console.log('CartData:', res);
                    this.cartData = res.data.data;  // 將傳回的資料存入
            })
        },
        addToCart(id, qty = 1){      // 加入購物車須帶入兩個參數(id, 數量)，加入參數預設子，當沒有傳入值時，數量預設 = 1
            const data = {          // 建構資料格式(在api文獻中)
                product_id: id,
                qty,
            };
            this.isLoadingItem = id;               
            axios.post(`${apiUrl}/api/${apiPath}/cart`, {data})      // 把資料格式帶到後面
                .then((res)=>{
                    console.log('addToCart:', res);
                    this.getCart();             // 當我加入購物車後再重新取得購物車的內容
                    this.isLoadingItem = ''     // 清空重置
                    this.$refs.productModal.closeModal();
            })
        },
        removeCartItem(id){    // 刪除購物車單一品項
            this.isLoadingItem = id;
            axios.delete(`${apiUrl}/api/${apiPath}/cart/${id}`)      
            .then((res)=>{
                console.log('removeCartItem:', res);
                this.getCart();             // 重新取得購物車的內容
                this.isLoadingItem = ''     // 清空重置
           })
        },
        updateCartItem(item){      // 更新單一商品數量
            const data = {          // 建構資料格式(在api文獻中)
                product_id: item.id,
                qty: item.qty,
            };
            this.isLoadingItem = item.id;               
            axios.put(`${apiUrl}/api/${apiPath}/cart/${item.id}`, {data})      // 把資料格式帶到後面
                .then((res)=>{
                    console.log('updateCartItem:', res);
                    this.getCart();             // 當我加入購物車後再重新取得購物車的內容
                    this.isLoadingItem = ''     // 清空重置
            })
        },
        createOrder(){
            axios.post(`${apiUrl}/api/${apiPath}/order`, {data: this.form})      
                .then((res)=>{
                    alert(res.data.message);
                    this.$refs.form.resetForm(); // 送出訂單後，清空欄位
                    this.getCart();
                })
                .catch((err) => {
                    alert(err.data.message);
                });
        },
        deleteAllCarts() {
            const url = `${apiUrl}/api/${apiPath}/carts`;
            axios.delete(url).then((response) => {
              alert(response.data.message);
              this.getCart();
            }).catch((err) => {
              alert(err.data.message);
            });
        },
    },
    mounted(){
        this.getProducts();
        this.getCart();
    }
})

//  建立 Vee 驗證元件
app.component('VForm', Form);
app.component('VField', Field);
app.component('ErrorMessage', ErrorMessage);

// 註冊 Modal元件 ($refs)
app.component('product-modal',{
    props:['id'],
    template: '#userProductModal',
    data(){
        return{
            modal:{},
            product:{},
            qty: 1,
        }
    },
    watch:{     // 監控id 如果有變更就重新抓取資料
        id(){
            this.getProduct();
        }
    },

    methods:{
        openModal(){
            this.modal.show();
        },
        closeModal(){
            this.modal.hide();
        },
        getProduct(){
            axios.get(`${apiUrl}/api/${apiPath}/product/${this.id}`)
                .then((res)=>{
                    console.log(res);
                    this.product = res.data.product       // 抓取傳回的資料
            })
        },
        addToCart(){
            this.$emit('add-cart', this.product.id, this.qty) // 呼叫外層中的方法('html溝通橋梁', 要帶入的參數)
        }
    },
    mounted(){
        // ref="modal"
        this.modal = new bootstrap.Modal(this.$refs.modal);
    }
});
app.mount('#app');