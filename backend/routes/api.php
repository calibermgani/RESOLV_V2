<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AllClaimsController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClaimProcessController;
use App\Http\Controllers\Client_assistanceController;
use App\Http\Controllers\CreateworkorderController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\GraphController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PracticeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RcmController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\Userregister;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//     return $request->user();
// });

Route::group([
    'middleware' => ['api', 'SessionHandler']
], function ($router) {

    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('checktoken', [AuthController::class, 'refresh']);
    Route::post('getPermissions', [AuthController::class, 'getPermissions']);
    Route::post('me', [AuthController::class, 'me']);

    Route::post('register', [Userregister::class, 'register']);
    Route::post('getroles', [Userregister::class, 'getroles']);
    Route::post('validateusername', [Userregister::class, 'validateusername']);
    Route::post('get_users_list', [Userregister::class, 'get_users_list']);
    Route::post('update_user_details', [Userregister::class, 'update_user_details']);
    Route::post('getPracticesList', [Userregister::class, 'getPracticesList']);

    Route::post('create_roles', [RoleController::class, 'create_roles']);
    Route::post('update_roles', [RoleController::class, 'update_roles']);

    Route::post('getprofile', [ProfileController::class, 'getprofile']);
    Route::post('setimage', [ProfileController::class, 'setimage']);
    Route::post('updateprofile', [ProfileController::class, 'updateprofile']);

    Route::post('upload', [ImportController::class, 'upload']);
    Route::post('get_upload_table_page', [ImportController::class, 'get_upload_table_page']);
    Route::post('getfile', [ImportController::class, 'getfile']);
    Route::post('template', [ImportController::class, 'template']);
    Route::post('createclaim', [ImportController::class, 'createclaim']);
    Route::post('updatemismatch', [ImportController::class, 'updatemismatch']);
    Route::post('updateingnore', [ImportController::class, 'updateingnore']);
    Route::post('overwrite', [ImportController::class, 'overwrite']);
    Route::post('overwrite_all', [ImportController::class, 'overwrite_all']);
    Route::post('get_table_page', [ImportController::class, 'get_table_page']);
    Route::post('get_audit_table_page', [ImportController::class, 'get_audit_table_page']);
    Route::post('get_related_calims', [ImportController::class, 'get_related_calims']);
    Route::post('fetch_claim_export_data', [ImportController::class, 'fetch_export_data']);
    Route::post('get_line_items', [ImportController::class, 'get_line_items']);
    Route::post('delete_upload_file', [ImportController::class, 'delete_upload_file']);
    Route::post('process_upload_file', [ImportController::class, 'process_upload_file']);
    Route::post('get_file_ready_count', [ImportController::class, 'get_file_ready_count']);
    Route::post('update_auto_close_claims', [ImportController::class, 'updateAutoClose']);
    Route::post('get_payer_name', [ImportController::class, 'get_payer_name']);
    Route::post('file_reimport', [ImportController::class, 'reImport']);
    Route::post('get_reimport_table_page', [ImportController::class, 'get_reimport_table_page']);
    Route::post('reimport_template', [ImportController::class, 'reimport_template']);
    Route::post('move_create_work_order', [ImportController::class, 'move_create_work_order']);
    Route::post('get_reassigned_users', [ImportController::class, 'get_reassigned_users']);
    Route::post('audit_claims_found_user', [ImportController::class, 'audit_claims_found_user']);

    Route::post('getfields', [SettingsController::class, 'getfields']);
    Route::post('setsetting', [SettingsController::class, 'setsetting']);
    Route::post('create_category', [SettingsController::class, 'create_category']);
    Route::post('get_category', [SettingsController::class, 'get_category']);
    Route::post('create_questions', [SettingsController::class, 'create_questions']);
    Route::post('update_category', [SettingsController::class, 'update_category']);
    Route::post('update_questions', [SettingsController::class, 'update_questions']);
    Route::post('create_statuscode', [SettingsController::class, 'create_statuscode']);
    Route::post('get_status_codes', [SettingsController::class, 'get_status_codes']);
    Route::post('create_substatus_code', [SettingsController::class, 'create_substatus_code']);
    Route::post('update_status_code', [SettingsController::class, 'update_status_code']);
    Route::post('get_root_cause', [SettingsController::class, 'get_root_cause']);
    Route::post('create_root_cause', [SettingsController::class, 'create_root_cause']);
    Route::post('get_error_type', [SettingsController::class, 'get_error_type']);
    Route::post('create_error_type', [SettingsController::class, 'create_error_type']);
    Route::post('get_practice_stats', [SettingsController::class, 'get_practice_stats']);
    Route::post('update_prac_settings', [SettingsController::class, 'update_prac_settings']);
    Route::post('get_setting_importsearch', [SettingsController::class, 'get_setting_importsearch']);
    Route::post('create_error_parameters', [SettingsController::class, 'create_error_parameters']);
    Route::post('create_fyi_parameters', [SettingsController::class, 'create_fyi_parameters']);

    Route::post('createpractice', [PracticeController::class, 'createpractice']);
    Route::any('getPractices', [PracticeController::class, 'getPractices']);
    Route::post('selectPractice', [PracticeController::class, 'selectPractice']);

    Route::post('getclaim_details', [CreateworkorderController::class, 'getclaim_details']);
    Route::post('team_claims', [CreateworkorderController::class, 'team_claims']);
    Route::post('process_note', [CreateworkorderController::class, 'process_note']);
    Route::post('getnotes', [CreateworkorderController::class, 'getnotes']);
    Route::post('claim_note', [CreateworkorderController::class, 'claim_note']);
    Route::post('qc_note', [CreateworkorderController::class, 'qc_note']);
    Route::post('create_followup', [CreateworkorderController::class, 'create_followup']);
    Route::post('get_followup', [CreateworkorderController::class, 'get_followup']);
    Route::post('get_associates', [CreateworkorderController::class, 'get_associates']);
    Route::post('create_workorder', [CreateworkorderController::class, 'create_workorder']);
    Route::post('check_claims', [CreateworkorderController::class, 'check_claims']);
    Route::post('get_workorder', [CreateworkorderController::class, 'get_workorder']);
    Route::post('get_workorder_details', [CreateworkorderController::class, 'get_workorder_details']);
    Route::post('client_note', [CreateworkorderController::class, 'client_note']);
    Route::post('get_client_notes', [CreateworkorderController::class, 'get_client_notes']);
    Route::post('fetch_wo_export_data', [CreateworkorderController::class, 'fetch_wo_export_data']);
    Route::post('fetch_followup_export_data', [CreateworkorderController::class, 'fetch_export_data']);
    Route::post('followup_process_notes_delete', [CreateworkorderController::class, 'followup_process_notes_delete']);
    Route::post('audit_process_notes_delete', [CreateworkorderController::class, 'audit_process_notes_delete']);
    Route::post('closed_followup_process_notes_delete', [CreateworkorderController::class, 'closed_followup_process_notes_delete']);
    Route::post('reasigned_followup_process_notes_delete', [CreateworkorderController::class, 'reasigned_followup_process_notes_delete']);
    Route::post('closed_audit_process_notes_delete', [CreateworkorderController::class, 'closed_audit_process_notes_delete']);
    Route::post('getclaim_details_order_list', [CreateworkorderController::class, 'getclaim_details_order_list']);
    Route::post('get_associate_name', [CreateworkorderController::class, 'get_associate_name']);
    Route::post('get_executive_list', [CreateworkorderController::class, 'getExecutiveList']);

    Route::post('create_followup_data', [ClaimProcessController::class, 'create_followup']);
    Route::post('reassign_calim', [ClaimProcessController::class, 'reassign_calim']);
    Route::post('check_edit_val', [ClaimProcessController::class, 'check_edit_val']);
    Route::post('check_notes_update', [ClaimProcessController::class, 'check_notes_update']);
    Route::post('get_note_details', [ClaimProcessController::class, 'get_note_details']);
    Route::post('get_claim_status', [ClaimProcessController::class, 'get_claim_status']);
    Route::post('claims_order_list', [ClaimProcessController::class, 'claims_order_list']);
    Route::post('reallocation_list', [ClaimProcessController::class, 'reallocationList']);
    Route::post('reallocate_claims', [ClaimProcessController::class, 'reAllocateClaims']);

    Route::post('get_audit_claim_details', [AuditController::class, 'get_audit_claim_details']);
    Route::post('get_auditors', [AuditController::class, 'get_auditors']);
    Route::post('fetch_audit_export_data', [AuditController::class, 'fetch_export_data']);
    Route::post('get_audit_codes', [AuditController::class, 'get_audit_codes']);
    Route::post('auto_assign_claims', [AuditController::class, 'auto_assign_claims']);
    Route::post('audit_assigned_order_list', [AuditController::class, 'audit_assigned_order_list']);
    Route::post('get_error_param_codes', [AuditController::class, 'get_error_param_codes']);
    Route::post('get_fyi_param_codes', [AuditController::class, 'get_fyi_param_codes']);
    Route::post('get_sub_error_param_codes', [AuditController::class, 'get_sub_error_param_codes']);

    Route::post('get_ca_claims', [Client_assistanceController::class, 'get_ca_claims']);
    Route::post('get_user_list', [Client_assistanceController::class, 'get_user_list']);
    Route::post('fetch_export_data', [Client_assistanceController::class, 'fetch_export_data']);
    Route::post('get_ca_payer_name', [Client_assistanceController::class, 'get_ca_payer_name']);

    Route::post('get_rcm_claims', [RcmController::class, 'get_rcm_claims']);
    Route::post('get_rcm_claims_sorting', [RcmController::class, 'get_rcm_claims_sorting']);
    Route::post('get_rcm_team_list', [RcmController::class, 'get_rcm_team_list']);
    Route::post('fetch_rcm_export_data', [RcmController::class, 'fetch_export_data']);

    Route::post('doc_name_validity', [DocumentController::class, 'doc_name_validity']);
    Route::post('upload_document_file', [DocumentController::class, 'upload_file']);
    Route::post('get_document_list', [DocumentController::class, 'get_document_list']);
    Route::post('download_doc_file', [DocumentController::class, 'download_doc_file']);
    Route::post('delete_doc_file', [DocumentController::class, 'delete_doc_file']);

    Route::post('get_work_order_details', [NotificationController::class, 'get_work_order_details']);

    Route::post('get_claim_graph_stats', [GraphController::class, 'get_claim_graph_stats']);
    Route::post('get_detailed', [GraphController::class, 'fetch_assoc_detail']);
    Route::post('get_claim_table_stats', [GraphController::class, 'get_claim_table_stats']);
    Route::post('get_summary_details', [GraphController::class, 'get_summary_details']);
    Route::post('get_prod_qual', [GraphController::class, 'get_prod_qual']);
    Route::post('get_month_details', [GraphController::class, 'get_month_details']);
    Route::post('process_weekly_data', [GraphController::class, 'process_weekly_data']);
    Route::post('get_audit_graph', [GraphController::class, 'get_audit_graph']);

    Route::post('createVendor', [AdminController::class, 'createVendor']);
    Route::post('getVendor', [AdminController::class, 'getVendor']);
    Route::post('updateVendor', [AdminController::class, 'updateVendor']);
    Route::post('getLogs', [AdminController::class, 'getLogs']);
    Route::post('viewLog', [AdminController::class, 'viewLog']);

    Route::post('getSummaryDetails', [DashboardController::class, 'getSummaryDetails']);
    Route::post('dashboard', [DashboardController::class, 'dashboard']);
    Route::post('reassignManager', [DashboardController::class, 'reassignManager']);
    Route::post('closeClaims', [DashboardController::class, 'closeClaims']);
    Route::post('closedClaims', [DashboardController::class, 'closedClaims']);
    Route::post('template_edit', [DashboardController::class, 'template_edit']);
    Route::post('insurance_name_list', [DashboardController::class, 'insurance_name_list']);
    Route::post('get_insurance', [DashboardController::class, 'get_insurance']);
    Route::post('update_followup_template', [DashboardController::class, 'update_followup_template']);
    Route::post('getclaim_details_reassign', [DashboardController::class, 'getclaim_details_reassign']);
    Route::post('claims_tooltip', [DashboardController::class, 'claims_tooltip']);
    Route::post('get_claimno', [DashboardController::class, 'get_claimno']);
    Route::post('get_audit_claimno', [DashboardController::class, 'get_audit_claimno']);
    Route::post('get_rcm_claimno', [DashboardController::class, 'get_rcm_claimno']);
    Route::post('get_client_claimno', [DashboardController::class, 'get_client_claimno']);
    Route::post('deletetemplate', [DashboardController::class, 'deletetemplate']);
    Route::post('getAlertNotification', [DashboardController::class, 'getAlertNotification']);

    Route::post('get_buyer', [ReportController::class, 'get_buyer']);
    Route::post('get_report_claims', [ReportController::class, 'get_report_claims']);
    Route::post('report_search', [ReportController::class, 'report_search']);
    Route::post('report_export_claims', [ReportController::class, 'report_export_claims']);

    Route::post('fetch_create_claims_export_data', [ExportController::class, 'fetch_create_claims_export_data']);
    Route::post('fetch_followup_claims_export_data', [ExportController::class, 'fetch_followup_claims_export_data']);
    Route::post('fetch_audit_claims_export_data', [ExportController::class, 'fetch_audit_claims_export_data']);
    Route::post('fetch_billing_claims_export_data', [ExportController::class, 'fetch_billing_claims_export_data']);
    Route::post('fetch_client_claims_export_data', [ExportController::class, 'fetch_client_claims_export_data']);
    Route::post('fetch_work_order_export_data', [ExportController::class, 'fetch_work_order_export_data']);
    Route::post('fetch_create_claims_export_data_pdf', [ExportController::class, 'fetch_create_claims_export_data_pdf']);
    Route::post('fetch_followup_claims_export_data_pdf', [ExportController::class, 'fetch_followup_claims_export_data_pdf']);
    Route::post('fetch_audit_claims_export_data_pdf', [ExportController::class, 'fetch_audit_claims_export_data_pdf']);
    Route::post('fetch_billing_claims_export_data_pdf', [ExportController::class, 'fetch_billing_claims_export_data_pdf']);
    Route::post('fetch_client_claims_export_data_pdf', [ExportController::class, 'fetch_client_claims_export_data_pdf']);
    Route::post('fetch_work_order_export_data_pdf', [ExportController::class, 'fetch_work_order_export_data_pdf']);
    Route::post('fetch_all_claims_export_data', [ExportController::class, 'fetch_all_claims_export_data']);

    Route::post('all_claim_list', [AllClaimsController::class, 'all_claim_list']);
});
