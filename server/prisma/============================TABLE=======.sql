============================TABLE=================================
============================TABLE=================================
============================TABLE=================================



CREATE TABLE MKN_stagging.dbo.fin_ar_saldoawal (
	arid int IDENTITY(1,1) NOT NULL,
	Comp_code char(3) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	Customer_Vendor int NULL,
	InvoiceNo varchar(30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	InvoiceDate datetime NULL,
	DueDate datetime NULL,
	Account_code varchar(15) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	Deskripsi varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	Poject_no varchar(15) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	currencycode char(3) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	NilaiFaktur numeric(18,2) NULL,
	DPP numeric(18,2) NULL,
	PPN numeric(18,2) NULL,
	SaldoBalance numeric(18,2) NULL,
	Belum numeric(18,2) NULL,
	Rate numeric(18,4) NULL,
	Tglkirim datetime NULL,
	[0-30] numeric(18,2) NULL,
	[31-60] numeric(18,2) NULL,
	[61-90] numeric(18,2) NULL,
	[91-120] numeric(18,2) NULL,
	[>120] numeric(18,2) NULL,
	[Tax 1 Base Currency] float NULL,
	[Tax 2 Base Currency] float NULL,
	NOAKUN nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[Nama Akun AR] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[No# Pelanggan] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[Nama Pelanggan] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	ket1 varchar(60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	ket2 varchar(60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	ket3 varchar(60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	ket4 varchar(60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	ket5 varchar(60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	ket6 varchar(60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	period_1 varchar(60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	period_2 varchar(60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	period_3 varchar(60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	period_4 varchar(60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	period_5 varchar(60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	period_6 varchar(60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	ind char(1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL
);



CREATE TABLE MKN_stagging.dbo.fin_account_receivable (
	arid int IDENTITY(1,1) NOT NULL,
	ar_number char(25) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	ar_date datetime DEFAULT getdate() NULL,
	comp_code char(3) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	ar_type char(1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	bill_Invoice bit NULL,
	contractno_po_spo char(80) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	projectno char(15) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	collector char(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	project_jobtype char(3) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	billingyear char(4) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	billingmonth char(2) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	customerid char(4) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	ar_amount numeric(18,2) DEFAULT 0 NOT NULL,
	discount_amount numeric(18,2) DEFAULT 0 NOT NULL,
	discount_persen numeric(8,2) NOT NULL,
	ppnpersen numeric(8,2) DEFAULT 0 NOT NULL,
	pphpersen numeric(8,2) DEFAULT 0 NOT NULL,
	ppnamount numeric(18,2) DEFAULT 0 NOT NULL,
	pphamount numeric(18,2) DEFAULT 0 NOT NULL,
	transportation nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT '0' NULL,
	currencycode char(3) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	deliveryorder char(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	persen_progress numeric(7,2) DEFAULT 0 NOT NULL,
	closingdate datetime NULL,
	ardate_old nchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	created_date datetime DEFAULT getdate() NULL,
	CONSTRAINT PK_FIN_ACCOUNT_RECEIVABLE PRIMARY KEY (arid)
);

-- Extended properties

EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'GENERATE AR/0823/001', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'ar_number';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isian form tanggal', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'ar_date';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'view billing', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'comp_code';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'KOSONGIN', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'ar_type';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'kosongin aja', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'bill_Invoice';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'view billing', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'contractno_po_spo';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'view billing', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'projectno';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isian form', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'collector';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'KOSONGIN', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'project_jobtype';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'view billing', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'billingyear';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'view billing', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'billingmonth';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'view billing', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'customerid';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'AMOUNT SETELAH PERHITUNGAN/TOTAL', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'ar_amount';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isian form', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'discount_amount';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isian form', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'discount_persen';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isian form', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'ppnpersen';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isian form', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'pphpersen';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isian form', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'ppnamount';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isian form', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'pphamount';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isian form', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'transportation';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'view billing', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'currencycode';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isian form', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'deliveryorder';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isian form', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'persen_progress';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'kosongin', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_account_receivable', @level2type=N'Column', @level2name=N'closingdate';





CREATE TABLE MKN_stagging.dbo.fin_outgoing_invoice (
	OinvDetid int IDENTITY(1,1) NOT NULL,
	invoice_id int NOT NULL,
	orderno_contract varchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	amount numeric(18,2) NULL,
	currency_code char(3) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	ar_id int NULL,
	type_id int NULL,
	qty int NULL,
	uom_id int NULL,
	ta_no char(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	contract_id char(15) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	monthly_id int NULL,
	CONSTRAINT PK_fin_outgoing_invoice_1 PRIMARY KEY (OinvDetid),
	CONSTRAINT FK_fin_outgoing_invoice_fin_outgoing_invoice_hed FOREIGN KEY (invoice_id) REFERENCES MKN_stagging.dbo.fin_outgoing_invoice_hed(invoice_id) ON DELETE CASCADE
);

-- Extended properties

EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice', @level2type=N'Column', @level2name=N'orderno_contract';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice', @level2type=N'Column', @level2name=N'amount';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice', @level2type=N'Column', @level2name=N'currency_code';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'fin_jenis_invoice', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice', @level2type=N'Column', @level2name=N'type_id';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'mas_uom', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice', @level2type=N'Column', @level2name=N'uom_id';








CREATE TABLE MKN_stagging.dbo.fin_outgoing_invoice_hed (
	invoice_id int IDENTITY(1,1) NOT NULL,
	comp_code char(3) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	customerid int NULL,
	invoice_no char(25) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	invoice_date datetime NULL,
	contract_no char(150) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	project_no char(25) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[type] char(1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	persen_complete numeric(8,2) NULL,
	year_bill char(4) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	month_bill char(2) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	closing_date datetime NULL,
	duedate datetime NULL,
	ar_id int NULL,
	dono char(150) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	dodate datetime NULL,
	payment_method char(40) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	availlabledate datetime NULL,
	discount_persen numeric(8,2) NULL,
	discount_amount numeric(18,2) NULL,
	ourbank char(15) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	ppn numeric(18,2) NULL,
	pph numeric(18,2) NULL,
	down_payment numeric(18,2) NULL,
	currency_code char(3) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	input_by varchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	input_date datetime DEFAULT getdate() NULL,
	update_by varchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	update_date datetime NULL,
	type_id int NULL,
	invoice_dp char(25) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	remark varchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	termid int NULL,
	project_number char(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	submit_date datetime NULL,
	fin_loc char(3) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	is_wapu int DEFAULT 0 NULL,
	CONSTRAINT PK_fin_outgoing_invoice_hed PRIMARY KEY (invoice_id)
);
 CREATE NONCLUSTERED INDEX NonClusteredIndex-20241204-073624 ON dbo.fin_outgoing_invoice_hed (  invoice_date ASC  , invoice_no ASC  , project_no ASC  , comp_code ASC  , customerid ASC  , input_by ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;

-- Extended properties

EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isi', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice_hed', @level2type=N'Column', @level2name=N'comp_code';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isi', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice_hed', @level2type=N'Column', @level2name=N'customerid';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'otomatis', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice_hed', @level2type=N'Column', @level2name=N'invoice_no';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isi', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice_hed', @level2type=N'Column', @level2name=N'invoice_date';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isi', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice_hed', @level2type=N'Column', @level2name=N'project_no';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'turnkye atau recurring (otomatis)', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice_hed', @level2type=N'Column', @level2name=N'type';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'kalau turnkey show', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice_hed', @level2type=N'Column', @level2name=N'persen_complete';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isi', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice_hed', @level2type=N'Column', @level2name=N'year_bill';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isi', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice_hed', @level2type=N'Column', @level2name=N'month_bill';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isi', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice_hed', @level2type=N'Column', @level2name=N'duedate';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isi', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice_hed', @level2type=N'Column', @level2name=N'dono';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isi', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice_hed', @level2type=N'Column', @level2name=N'dodate';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isi = cash, transfer', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice_hed', @level2type=N'Column', @level2name=N'payment_method';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isi', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice_hed', @level2type=N'Column', @level2name=N'discount_persen';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'isi', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice_hed', @level2type=N'Column', @level2name=N'discount_amount';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'ada di catatan', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice_hed', @level2type=N'Column', @level2name=N'ourbank';
EXEC MKN_stagging.sys.sp_addextendedproperty @name=N'MS_Description', @value=N'fin_jenis_invoice', @level0type=N'Schema', @level0name=N'dbo', @level1type=N'Table', @level1name=N'fin_outgoing_invoice_hed', @level2type=N'Column', @level2name=N'type_id';



CREATE TABLE MKN_stagging.dbo.fin_cashbank (
	cbdetid int IDENTITY(1,1) NOT NULL,
	cbid int NULL,
	fromtransactionno varchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	tofrom_account_code varchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	amount numeric(18,2) NULL,
	currencycode char(3) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	rate numeric(18,6) NULL,
	fund_code char(6) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	customer char(6) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	costcenter char(4) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	projectno char(4) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	jobno char(2) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	costcode varchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	input_date datetime DEFAULT getdate() NULL,
	input_by char(5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	invoiceno varchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	pph_22 numeric(6,2) NULL,
	pph_23 numeric(6,2) NULL,
	pph_4 numeric(6,2) NULL,
	bank_charge numeric(17,2) NULL,
	other_fees numeric(17,2) NULL,
	discount_charge numeric(17,2) NULL,
	amount_ori numeric(18,2) NULL,
	type_payment varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	pph_22_amount numeric(18,2) NULL,
	pph_23_amount numeric(18,2) NULL,
	pph_4_amount numeric(18,2) NULL,
	ppn numeric(6,2) NULL,
	ppn_amount numeric(18,2) NULL,
	dp_amount numeric(18,2) NULL,
	doc_support varchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	acc_discount char(15) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	discount_amount numeric(18,2) NULL,
	cogs_amount numeric(18,2) NULL,
	CONSTRAINT PK_FIN_CASHBANK PRIMARY KEY (cbdetid),
	CONSTRAINT FK_FIN_CASH_REFERENCE_FIN_CASH FOREIGN KEY (cbid) REFERENCES MKN_stagging.dbo.fin_cashbankhed(cbid) ON DELETE CASCADE
);


CREATE TABLE MKN_stagging.dbo.mas_company (
	company_id int IDENTITY(1,1) NOT NULL,
	company_name varchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	full_name varchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	compcode char(3) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	address varchar(5000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	telepon varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	fax varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	website varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	logo_name varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	compcode_old char(3) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	CONSTRAINT PK__mas_comp__3E2672355E0040D7 PRIMARY KEY (company_id)
);






CREATE TABLE MKN_stagging.dbo.mas_customer (
	customer_id int IDENTITY(1,1) NOT NULL,
	customer_name varchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[type] char(200) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	nickname char(200) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	address varchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	sub_district varchar(200) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	district varchar(200) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	Province char(200) COLLATE SQL_Latin1_General_CP1_CS_AS NULL,
	City varchar(200) COLLATE SQL_Latin1_General_CP1_CS_AS NULL,
	postal_code char(200) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	Country varchar(200) COLLATE SQL_Latin1_General_CP1_CS_AS NULL,
	OfficePhone varchar(200) COLLATE SQL_Latin1_General_CP1_CS_AS NULL,
	ExtentionNumber varchar(200) COLLATE SQL_Latin1_General_CP1_CS_AS NULL,
	OfficeFax char(200) COLLATE SQL_Latin1_General_CP1_CS_AS NULL,
	CreditLimit nvarchar(200) COLLATE SQL_Latin1_General_CP1_CS_AS DEFAULT '0' NULL,
	TaxNumber char(200) COLLATE SQL_Latin1_General_CP1_CS_AS NULL,
	Siup varchar(200) COLLATE SQL_Latin1_General_CP1_CS_AS NULL,
	cert_agency varchar(200) COLLATE SQL_Latin1_General_CP1_CS_AS NULL,
	BankName nvarchar(200) COLLATE SQL_Latin1_General_CP1_CS_AS NULL,
	BankAccount char(200) COLLATE SQL_Latin1_General_CP1_CS_AS NULL,
	ContactPerson varchar(200) COLLATE SQL_Latin1_General_CP1_CS_AS NULL,
	Title char(200) COLLATE SQL_Latin1_General_CP1_CS_AS NULL,
	CellPhone varchar(200) COLLATE SQL_Latin1_General_CP1_CS_AS NULL,
	Website varchar(200) COLLATE SQL_Latin1_General_CP1_CS_AS NULL,
	Email varchar(200) COLLATE SQL_Latin1_General_CP1_CS_AS NULL,
	InactiveMark char(1) COLLATE SQL_Latin1_General_CP1_CS_AS NULL,
	inp_date datetime DEFAULT getdate() NULL,
	inp_by char(10) COLLATE SQL_Latin1_General_CP1_CS_AS NULL,
	attach varchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	is_group char(1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	ar_account char(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	dp_account char(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	ar_unbill char(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	TelcoRevenue char(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	ITRevenue char(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	OtherRevenue char(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	CONSTRAINT PK__mas_cust__CD65CB851C3107E1 PRIMARY KEY (customer_id)
);


CREATE TABLE MKN_stagging.dbo.mas_currency (
	currency_id int IDENTITY(1,1) NOT NULL,
	currency_description varchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	symbol char(4) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	initial char(3) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	CONSTRAINT PK__mas_curr__871A4AA9ED6005B3 PRIMARY KEY (currency_id)
);


CREATE TABLE MKN_stagging.dbo.fin_master_coa (
	account_code char(15) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	bankcomp_code char(3) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	account_name varchar(80) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	account_level char(1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	initvoucher char(3) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	parent_account char(15) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	dc char(1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	currency char(3) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	bank_account varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	branch varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	Address varchar(200) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	account_group varchar(80) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	consolidation_account char(15) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	account_type char(1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	interim char(1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	account_template char(3) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	expense_indicator char(1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	title_sum char(2) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	bs_is char(2) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	saldoawal numeric(18,2) NULL,
	convertcd char(4) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	ind char(1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	oldaccount char(15) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	CONSTRAINT PK_fin_master_coa_1 PRIMARY KEY (account_code),
	CONSTRAINT FK_fin_master_coa_fin_master_account_type1 FOREIGN KEY (account_type) REFERENCES MKN_stagging.dbo.fin_master_account_type(account_type)
);

CREATE TABLE MKN_stagging.dbo.pre_prospect (
	prospect_id nchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	budget_id nchar(9) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	customer_id int NULL,
	isnew_cust int NULL,
	prospect_name varchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	prospect_description varchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	sbu_id int NULL,
	start_date datetime NULL,
	end_date datetime NULL,
	amount decimal(18,0) NULL,
	currency_id int NOT NULL,
	status char(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	assign_to nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	user_reff_int nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	user_reff varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	probability numeric(18,0) NULL,
	input_by nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	isfinal_tax int NULL,
	iskyc_submit int NULL,
	created_date datetime DEFAULT getdate() NULL,
	customer_pic varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	amount_upd_history varchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	CONSTRAINT PK__pre_pros__E62316BDF4C2D372 PRIMARY KEY (prospect_id),
	CONSTRAINT FK_PRE_PROS_REFERENCE_MAS_CURR FOREIGN KEY (currency_id) REFERENCES MKN_stagging.dbo.mas_currency(currency_id),
	CONSTRAINT FK_PRE_PROS_REFERENCE_MAS_CUST FOREIGN KEY (customer_id) REFERENCES MKN_stagging.dbo.mas_customer(customer_id),
	CONSTRAINT FK_PRE_PROS_REFERENCE_PRE_SALE FOREIGN KEY (budget_id) REFERENCES MKN_stagging.dbo.pre_sales_budget(budget_id),
	CONSTRAINT FK_pre_prospect_mas_company FOREIGN KEY (sbu_id) REFERENCES MKN_stagging.dbo.mas_company(company_id)
);


CREATE TABLE MKN_stagging.dbo.pre_sales_budget (
	budget_id nchar(9) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	type_service varchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	sbu int NULL,
	customer_id int NULL,
	budget_year int NULL,
	award_date datetime NULL,
	award_period int NULL,
	contract_date datetime NULL,
	contract_period int NULL,
	proj_type_id int NULL,
	job_type_id int NULL,
	currency_id int NULL,
	status int DEFAULT 1 NULL,
	status_desc nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	input_by nchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	exchange_rate numeric(18,2) NULL,
	cogs numeric(18,2) NULL,
	pmo numeric(18,2) NULL,
	opex numeric(18,2) NULL,
	capex numeric(18,2) NULL,
	probability nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT '0' NULL,
	CONSTRAINT PK__pre_sale__3A655C14E9A36F3A PRIMARY KEY (budget_id),
	CONSTRAINT FK_PRE_SALE_REFERENCE_PRE_JOBT FOREIGN KEY (job_type_id) REFERENCES MKN_stagging.dbo.pre_job_type(job_type_id),
	CONSTRAINT FK_PRE_SALE_REFERENCE_PRE_PROJ FOREIGN KEY (proj_type_id) REFERENCES MKN_stagging.dbo.pre_project_type(proj_type_id),
	CONSTRAINT FK_pre_sales_budget_mas_currency FOREIGN KEY (currency_id) REFERENCES MKN_stagging.dbo.mas_currency(currency_id)
);



CREATE TABLE MKN_stagging.dbo.pre_project_type (
	proj_type_id int IDENTITY(1,1) NOT NULL,
	description nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	cogs_sbudget numeric(18,2) NULL,
	pmo_sbudget numeric(18,2) NULL,
	capex_sbudget numeric(18,2) NULL,
	opex_sbudget numeric(18,2) NULL,
	CONSTRAINT PK__pre_proj__F696C1F020491F69 PRIMARY KEY (proj_type_id)
);


============================TABLE=================================
============================TABLE=================================
============================TABLE=================================
