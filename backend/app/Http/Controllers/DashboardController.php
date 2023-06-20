<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\Action;
use App\Models\Address_flag;
use App\Models\Claim_history;
use App\Models\Claim_note;
use App\Models\Followup_template;
use App\Models\Import_field;
use App\Models\Insurance;
use App\Models\Profile;
use App\Models\Role;
use App\Models\Statuscode;
use App\Models\User;
use App\Models\User_work_profile;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct()
    {
		$this->middleware('auth:api', ['except' => ['dashboard','reassignManager','closeClaims', 'closedClaims', 'template_edit', 'insurance_name_list', 'update_followup_template','claims_tooltip', 'get_insurance', 'get_claimno', 'get_audit_claimno', 'get_rcm_claimno', 'get_client_claimno','getSummaryDetails','deletetemplate', 'getAlertNotification','get_users_lists']]);
	}

	public function dashboard(){

		$dataArr = [];
		/* Claim Aging  */
		$claimsAging = Import_field::selectRaw("(CASE WHEN (DATE(dos) >= date('".Carbon::now()->subDays(29)."') AND DATE(dos) <= date('".Carbon::now()."')) THEN total_ar ELSE 0 END) as day30,(CASE WHEN (DATE(dos) >= date('".Carbon::now()->subDays(59)."') AND DATE(dos) <= date('".Carbon::now()->subDays(30)."')) THEN total_ar ELSE 0 END) as day60,(CASE WHEN (DATE(dos) >= date('".Carbon::now()->subDays(89)."') AND DATE(dos) <= date('".Carbon::now()->subDays(60)."')) THEN total_ar ELSE 0 END) as day90,(CASE WHEN (DATE(dos) >= date('".Carbon::now()->subDays(119)."') AND DATE(dos) <= date('".Carbon::now()->subDays(90)."')) THEN total_ar ELSE 0 END) as day120,(CASE WHEN (DATE(dos) >= date('".Carbon::now()->subDays(179)."') AND DATE(dos) <= date('".Carbon::now()->subDays(120)."')) THEN total_ar ELSE 0 END) as day180,(CASE WHEN (DATE(dos) >= date('".Carbon::now()->subDays(364)."') AND DATE(dos) <= date('".Carbon::now()->subDays(180)."')) THEN total_ar ELSE 0 END) as day365,(CASE WHEN (DATE(dos) <= date('".Carbon::now()->subDays(365)."')) THEN total_ar ELSE 0 END) as day366")->groupBy('id')->get()->toArray();

		$dataArr['data']['aging_analysis']['day30'] = array_sum(array_column($claimsAging, 'day30'));
		$dataArr['data']['aging_analysis']['day60'] = array_sum(array_column($claimsAging, 'day60'));
		$dataArr['data']['aging_analysis']['day90'] = array_sum(array_column($claimsAging, 'day90'));
		$dataArr['data']['aging_analysis']['day120'] = array_sum(array_column($claimsAging, 'day120'));
		$dataArr['data']['aging_analysis']['day180'] = array_sum(array_column($claimsAging, 'day180'));
		$dataArr['data']['aging_analysis']['day365'] = array_sum(array_column($claimsAging, 'day365'));
		$dataArr['data']['aging_analysis']['day366'] = array_sum(array_column($claimsAging, 'day366'));
		$dataArr['data']['aging_analysis']['atb_claims'] = count($claimsAging);
		$dataArr['data']['aging_analysis']['atb_values'] = number_format($dataArr['data']['aging_analysis']['day30'] + $dataArr['data']['aging_analysis']['day60'] + $dataArr['data']['aging_analysis']['day90'] + $dataArr['data']['aging_analysis']['day120'] + $dataArr['data']['aging_analysis']['day180'] + $dataArr['data']['aging_analysis']['day365'] + $dataArr['data']['aging_analysis']['day366'],2);
		$dataArr['data']['aging_analysis']['month'] = 0;

		/* Insurance top 10 Charges */
		$insuranceTotalCaarges = Import_field::selectRaw('responsibility as Insurance, sum(total_charges) as totalCharges')->groupBy('responsibility')->orderBy('totalCharges','desc')->take(10)->get()->toArray();
		$dataArr['data']['payer_classfication']['insurance'] = $insuranceTotalCaarges;

		/* Touch count  */
		$monthArray = array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');
		$claimTouchCount = Claim_note::selectRaw("claim_id,count(claim_id) as count,DATE_FORMAT(created_at,'%M') as MonthNum")->groupBy('claim_id')->get()->toArray();

		foreach($monthArray as $lists){
			$dataArr['data']['touch_analysis'][$lists]['less3'] = $dataArr['data']['touch_analysis'][$lists]['three'] = $dataArr['data']['touch_analysis'][$lists]['four'] = $dataArr['data']['touch_analysis'][$lists]['five'] = $dataArr['data']['touch_analysis'][$lists]['six'] = $dataArr['data']['touch_analysis'][$lists]['sixplus'] = 0;
			foreach($claimTouchCount as $list){
				if($list['MonthNum'] == $lists)
					if($list['count'] < 3)
						$dataArr['data']['touch_analysis'][$lists]['less3'] = $dataArr['data']['touch_analysis'][$lists]['less3'] + 1;
					elseif($list['count'] == 3)
						$dataArr['data']['touch_analysis'][$lists]['three'] = $dataArr['data']['touch_analysis'][$lists]['three'] + 1;
					elseif($list['count'] == 4)
						$dataArr['data']['touch_analysis'][$lists]['four'] = $dataArr['data']['touch_analysis'][$lists]['four'] + 1;
					elseif($list['count'] == 5)
						$dataArr['data']['touch_analysis'][$lists]['five'] = $dataArr['data']['touch_analysis'][$lists]['five'] + 1;
					elseif($list['count'] == 6)
						$dataArr['data']['touch_analysis'][$lists]['six'] = $dataArr['data']['touch_analysis'][$lists]['six'] + 1;
					elseif($list['count'] > 6)
						$dataArr['data']['touch_analysis'][$lists]['sixplus'] = $dataArr['data']['touch_analysis'][$lists]['sixplus'] + 1;
			}
		}

		$statusInfo = Import_field::selectRaw('status_code,count(status_code) as statuscount,sum(total_charges) as totalCharges')->where('status_code','!=',0)->groupBy('status_code')->get()->toArray();
		$statusDetails = Statuscode::pluck('status_code','id')->toArray();
		$statusCount = 0;
		$claimsCount = $totalCharges = 0;
		foreach($statusInfo as $statusId){
			$claimsCount = $claimsCount + $statusId['statuscount'];
			$totalCharges = $totalCharges + $statusId['totalCharges'];
			$dataArr['data']['status_code']['header'][$statusCount]['statusCode'] = $statusDetails[$statusId['status_code']];
			$dataArr['data']['status_code']['header'][$statusCount]['statusValue'] = $statusId['statuscount'];
			$statusCount++;
		}
		$dataArr['data']['status_code']['footer']['total_claims'] = $claimsCount;
		$dataArr['data']['status_code']['footer']['totalCharges'] = $totalCharges;

		/* ARcaller performance */
		$arInfo = User::pluck('user_name','id')->toArray();
		$performCount = 0;
		$pending = $assign = $worked = $resolved = 0;
		foreach($arInfo as $key=>$value){
			$pending = Claim_history::where('assigned_to',$key)->groupBy('claim_id')->havingRaw('COUNT(*) <= 1 ')->get()->toArray();
			$assign = Claim_history::where('assigned_to',$key)->groupBy('claim_id')->get()->toArray();
			$worked = Claim_history::where('assigned_by',$key)->groupBy('claim_id')->get()->toArray();
			$dataArr['data']['performance'][$performCount]['name'] = $value;
			$dataArr['data']['performance'][$performCount]['pending'] = count($pending);
			$dataArr['data']['performance'][$performCount]['assign'] = count($assign);
			$dataArr['data']['performance'][$performCount]['worked'] = count($worked);
			$dataArr['data']['performance'][$performCount]['resolved'] = $resolved;
			$performCount++;
		}

		$dataArr['status'] = 'Success';
		$dataArr['statusCode'] = 200;
		return json_encode($dataArr);

	}

	public function reassignManager(LoginRequest $request){

		$claimArr = $request->get('claim_no');

		$reassign = $request->get('reassign');

		if($reassign == 'reassign'){

			foreach($claimArr as $claims){
				$response['status'] = $claims;
				$assignBy = $request->get('user_id');
				//dd($assignBy);

				$data = Claim_history::where('claim_id',$claims)->distinct('claim_id')->orderBy('claim_id','asc')->first();

				if($assignBy == $data->assigned_by){
					$assignTo = $data->assigned_by;
				}else if($assignBy != $data->assigned_by){
					$assignTo = $data->assigned_by;
					$dataArr['assigned_by'] = $assignBy;
					$dataArr['assigned_to'] = $assignTo;
					$dataArr['claim_state'] = 3;
					$dataArr['claim_id'] = $data->claim_id;

					Claim_history::create($dataArr);
					$actionArr['action_type'] = 1;
					$actionArr['claim_id'] = $data->claim_id;
					$actionArr['assigned_to'] = $assignTo;
					$actionArr['assigned_by'] = $assignBy;
					$actionArr['status'] = 'Active';

					Action::create($actionArr);

					Import_field::where('claim_no',$claims)->update(array('assigned_to'=>$assignTo));
				}




			}

		}else{


			foreach($claimArr as $claims){
				$response['status'] = $claims;
				$assignBy = $request->get('user_id');
				//dd($assignBy);

				$data = Claim_history::where('claim_id',$claims)->distinct('claim_id')->orderBy('claim_id','asc')->first();

				if($assignBy == $data->assigned_by){
					//dd('first');
					$assignTo = $data->assigned_by;
				}else if($assignBy != $data->assigned_by){

					$assignTo = $data->assigned_by;
					$dataArr['assigned_by'] = $assignBy;
					$dataArr['assigned_to'] = $assignTo;
					$dataArr['claim_state'] = 3;
					$dataArr['claim_id'] = $data->claim_id;

					Claim_history::create($dataArr);
					$actionArr['action_type'] = 1;
					$actionArr['claim_id'] = $data->claim_id;
					$actionArr['assigned_to'] = $assignTo;
					$actionArr['assigned_by'] = $assignBy;
					$actionArr['status'] = 'Active';

					Action::create($actionArr);

					Import_field::where('claim_no',$claims)->update(array('assigned_to'=>$assignTo));
				}

			}
			}



		$response['status'] = 'success';
		$response['statusCode'] = 200;
		$response['assigned_to'] = $assignTo;
		$response['assigned_by'] = $assignBy;
		return json_encode($response);
	}

	public function closeClaims(LoginRequest $request){
		$claimArr = $request->get('claim_no');
		$response = [];
		foreach($claimArr as $claims){
			Import_field::where('claim_no',$claims)->update(array('claim_closing'=>'1'));
		}
		$response['status'] = 'success';
		$response['statusCode'] = 200;
		return response($response);

	}

	public function closedClaims(LoginRequest $request){
		$claimArr = $request->get('claim_no');
		$response = [];
		foreach($claimArr as $claims){
		//dd($claims);
			$closedClaims = Import_field::where('claim_no',$claims)->update(array('claim_closing'=>'1'));

			$closedClaims = Claim_history::where('claim_id',$claims)->update(array('claim_state'=>'9'));
		}

		$response['status'] = 'success';
		$response['statusCode'] = 200;
		return response($response);

	}

	public function template_edit(Request $request){
		$claim_id = $request->get('claim_id');
		$user_id = $request->get('user_id');

		$followup_template = Followup_template::where('id', $claim_id)->where('created_by', $user_id)->first();


		$response['status'] = 'success';
		$response['statusCode'] = 200;
		$response['data'] = $followup_template;
		return response($response);
	}

	public function insurance_name_list(Request $request){
		$insurance_name = Insurance::select('id', 'ins_name')->get();
		$response['status'] = 'success';
		$response['statusCode'] = 200;
		$response['data'] = $insurance_name;
		return response($response);
	}

	public function update_followup_template(Request $request){

		$temp_id = $request->get('temp_id');
		// $user_id = $request->get('user_id');
		// $claim_id = $request->get('claim_id');
		// $form_data = $request->get('form_data');
		// $questions = $request->get('questions');
		// $question_data=[];

		$claim_id=$request->get('claim_no');
	    $questions=$request->get('question_data');
	    $form_data=$request->get('form_data');
	    //dd($form_data);
		//dd($form_data['entry_date']);
		if(!empty($form_data['What_s_the_effective_date_of_policy_'])){
			$startDate = date('Y-m-d',strtotime($form_data['What_s_the_effective_date_of_policy_']['startDate']));
		    $endDate = date('Y-m-d',strtotime($form_data['What_s_the_effective_date_of_policy_']['endDate']));
		}elseif(!empty($form_data['hia'])){
			$startDate = date('Y-m-d',strtotime($form_data['hia']['startDate']));
		    $endDate = date('Y-m-d',strtotime($form_data['hia']['endDate']));
		}



		// dd($startDate.'-'.$endDate);

	    $entry_date = implode('-', $form_data['entry_date']);
	    $entry_date = date('Y-m-d', strtotime($entry_date));
	    //dd($entry_date);
	    //dd($form_data['What_s_the_effective_date_of_policy_']);
	    //$question_double_date = explode(' - ', $form_data['What_s_the_effective_date_of_policy_']);
	    //dd($question_double_date);
	    $user_id=$request->get('user_id');
	    $category=$request->get('cat');
	    $question_data=[];
	    $i=0;

		foreach($questions as $i => $quest)
	    {
	        $question_data[$i]['question']= $quest['question'];
	        $question_data[$i]['hint']=$quest['hint'];
	        $question_data[$i]['question_label']=$quest['question_label'];
	        $answer=$form_data[$quest['question_label']];
	        //dd($answer);
	        if($quest['date_type']=='double_date')
	        {
	            // $from=date('Y-m-d',strtotime($question_double_date[0]));

	            // if (isset($question_double_date[1])) {
	            //     $to=date('Y-m-d',strtotime($question_double_date[1]));
	            // }else{
	            //     $to=date('Y-m-d',strtotime($question_double_date[0]));
	            // }

	            $question_data[$i]['answer']=$startDate.'-'.$endDate;
	            //dd($question_data[$i]['answer']);
	            // $date=date('Y-m-d',strtotime($form_data['entry_date']['endDate']));

	        }
	        else if($quest['field_type']=='Date')
	        {
	            $question_data[$i]['type']="date";
	            //dd($question_data[$i]['type']);

	            $question_data[$i]['answer']=date('Y-m-d',strtotime($answer['endDate']));
	            //dd($question_data[$i]['answer']);
	        }
	        else{
	            $question_data[$i]['answer']=$answer;
	        }
	        $i++;
	    }

	    //$arr = array('Hello','World!','Beautiful','Day!');
		 $date = implode("-",$form_data['entry_date']);

	    //$date=date('Y-m-d',strtotime($form_data['entry_date']['endDate']));

	    //dd($form_data['entry_date']);

		$followup_insert=Followup_template::where('id', $temp_id)->update(
        [
            'claim_id'            => $claim_id,
            'rep_name'            => $form_data['rep_name'],
            'date'                => $date,
            'phone'               => $form_data['phone'],
            'insurance'        	 =>  $form_data['insurance'], //Value have to be changed
            'category_id'         => $form_data['label_name'],
            'content'             => json_encode($question_data),
            'created_by'          => $user_id
        ]);

	    return response()->json([
	        'data' => 'success'
	        ]);
	}

	public function deletetemplate(LoginRequest $request){

		$delete_id = $request->get('delete_id');

		$claim_data = Followup_template::where('id', $delete_id)->delete();

		return response()->json([
		'data' => $claim_data,
        'message' => 'delete was successfully'
        ]);
	}

	public function claims_tooltip(LoginRequest $request){
		$claim_no = $request->get('claim_no');

		$claim_data = Import_field::where('claim_no',$claim_no)->first();

		return response()->json([
			'claim_data' => $claim_data,
        	'data' => 'success'
        ]);
	}

	public function get_insurance(LoginRequest $request){
		$claim_no = $request->get('user_id');

		$claim_data = Insurance::select('id', 'ins_name')->get();

		return response()->json([
			'claim_data' => $claim_data,
        	'data' => 'success'
        ]);
	}

    public function get_claimno(LoginRequest $request){
		$claim_no = $request->get('claim_no');
		$user_id = $request->get('user_id');
		$claim_type = $request->get('claim_type');
		$type = $request->get('type');

		$claims = Import_field::where('claim_no', $claim_no)->first();

		//dd($claims);

		$Claim_history=Claim_history::where('assigned_to', $user_id)->orderBy('id','desc')->groupBy('claim_id')->get();

		if($type == 'allocated'){

			foreach($Claim_history as $key => $active)
	        {
	            $query = DB::table('claim_histories')
	                ->select(DB::raw("COUNT(claim_id) count, claim_id, id"))
	                ->where('claim_id' , $active['claim_id'])
	                ->where('assigned_to' , $user_id)
	                ->havingRaw("COUNT(claim_id) = 1")
	                ->get()->toArray();
	            $count[$key] = (isset($query[0]))?$query[0]->claim_id:0;

	        }

	        foreach($count as $values){

		        $claim_data[] = Import_field::where('claim_no',  $values)->where('assigned_to', $user_id)->where('claim_status', 'Assigned')->get()->toArray();

		    }
	        $claim_array = array_filter(array_map('array_filter', $claim_data));

	        $multi_claim_data = $claim_array;

	        $merge_claim_data = array_reduce($multi_claim_data, 'array_merge', array());

	        $assign = array_column($merge_claim_data, 'claim_no');

			$claim_data = in_array($claim_no, $assign);


		}elseif ($type == 'reallocated') {
			foreach($Claim_history as $key => $active)
            {
                $query = DB::table('claim_histories')
                    ->select(DB::raw("COUNT(claim_id) count, claim_id, id"))
                    ->where('claim_id' , $active['claim_id'])
                    ->where('assigned_to' , $user_id)
                    ->havingRaw("COUNT(claim_id) != 1")
                    ->get()->toArray();
                $count[$key] = (isset($query[0]))?$query[0]->claim_id:0;

            }

            foreach($count as $values){
	            $claim_data[] = Import_field::where('claim_no',  $values)->where('assigned_to', $user_id)->where('claim_status', 'Assigned')->get()->toArray();

	        }
	            $claim_array = array_filter(array_map('array_filter', $claim_data));

	            $multi_claim_data = $claim_array;

	            $merge_claim_data = array_reduce($multi_claim_data, 'array_merge', array());


	            $reassign = array_column($merge_claim_data, 'claim_no');


	            $claim_data = in_array($claim_no, $reassign);

		}elseif ($type == 'completed') {

			$worked = [];
			$claims =Action::where('assigned_to', $user_id)->where('status','Active')->groupBy('claim_id')->get();

			//dd($claims);

			foreach($claims as $active)
            {
            	$date = date('Y-m-d', strtotime($active['created_at'])) ;

                $allocated=Claim_history::where('claim_id',$active['claim_id'])->whereIN('claim_state',[9])->where('created_at','>=',$date)->count();

                if($allocated > 0)
                {
                    array_push($worked,$active['claim_id']);
                }

            }

				$claims_count = Import_field::select('claim_no')->whereIN('claim_no',$worked)->where('claim_closing',1)->get()->toArray();

				foreach($claims_count as $values){
		            $claim_data[] = Import_field::where('claim_no',  $values)->where('assigned_to', $user_id)->where('claim_closing',1)->get()->toArray();

		        }
	            $claim_array = array_filter(array_map('array_filter', $claim_data));

	            $multi_claim_data = $claim_array;

	            $merge_claim_data = array_reduce($multi_claim_data, 'array_merge', array());

	            $completed = array_column($merge_claim_data, 'claim_no');

	            $claim_data = in_array($claim_no, $completed);

		}elseif ($type == 'closedClaims') {

				$closed= [];
				$claimInfo = Claim_history::orderBy('id','desc')->get()->unique('claim_id')->toArray();

				foreach($claimInfo as $claimList){

					if(isset($claimList))
						array_push($closed,$claimList['claim_id']);
				}

				$claim_data[] = Import_field::select('claim_no')->whereIN('claim_no',$closed)->where('claim_closing',1)->get()->toArray();

				$claim_array = array_filter(array_map('array_filter', $claim_data));

	            $multi_claim_data = $claim_array;

	            $merge_claim_data = array_reduce($multi_claim_data, 'array_merge', array());

	            $closedClaims = array_column($merge_claim_data, 'claim_no');

	            $claim_data = in_array($claim_no, $closedClaims);

		}


		return response()->json([
			'claim_count' => $claim_data,
			'claim_no' => $claim_no,
			'claim' => $claims,
        	'data' => 'success'
        ]);

    }

    public function get_audit_claimno(LoginRequest $request){

    	$claim_no = $request->get('claim_no');
		$user_id = $request->get('user_id');
		$claim_type = $request->get('claim_type');
		$type = $request->get('type');

    	$worked=[];
        $pending=[];
        $clams=[];
        $assign=[];
        $closed=[];
        $audit = [];

		if($type == 'allocated'){

			$claims=Action::where('assigned_to', $user_id)->where('action_type',2)->where('status','Active')->get();


	        foreach($claims as $active)
	        {
	            $date = date('Y-m-d', strtotime($active['created_at'])) ;

	            $allocated=Claim_history::where('claim_id',$active['claim_id'])->whereIN('claim_state',[4,6,7,8,9])->where('created_at','>=',$date)->count();

	            if($allocated > 0)
	            {
	                array_push($worked,$active['claim_id']);
	            }
	            else{
	                array_push($pending,$active['claim_id']);
	            }

	        }

	        $claimInfo = Claim_history::orderBy('id','desc')->get()->unique('claim_id')->toArray();


	        foreach($claimInfo as $claimList){
				if(isset($claimList) && $claimList['claim_state'] == 5 && $claimList['assigned_to'] == $user_id)
					array_push($assign,$claimList['claim_id']);
			}


			$claim_data[] = Import_field::select('claim_no')->whereIN('claim_no',$assign)->where('claim_closing', '!=', 1)->get()->toArray();

			$claim_array = array_filter(array_map('array_filter', $claim_data));

	        $multi_claim_data = $claim_array;

	        $merge_claim_data = array_reduce($multi_claim_data, 'array_merge', array());

	        $allocated = array_column($merge_claim_data, 'claim_no');

	        $claim_data = in_array($claim_no, $allocated);
        }elseif($type == 'completed'){
        	$claimInfo = Claim_history::orderBy('id','desc')->get()->unique('claim_id')->toArray();

			foreach($claimInfo as $claimList){

				if(isset($claimList) && $claimList['claim_state'] == 9 &&  $claimList['assigned_by'] == $user_id)
					array_push($closed,$claimList['claim_id']);
			}

			$claim_data[]= Import_field::whereIN('claim_no',$closed)->where('claim_closing',1)->get()->toArray();

			$claim_array = array_filter(array_map('array_filter', $claim_data));

	        $multi_claim_data = $claim_array;

	        $merge_claim_data = array_reduce($multi_claim_data, 'array_merge', array());

	        $completed = array_column($merge_claim_data, 'claim_no');

	        $claim_data = in_array($claim_no, $completed);
        }elseif ($type == 'wo') {
        	$claimInfo = Claim_history::orderBy('id','desc')->get()->unique('claim_id')->toArray();

			foreach($claimInfo as $list){
				if($list['claim_state'] == 4)
					array_push($audit,$list['claim_id']);
			}

			$claim_data[] = Import_field::whereIN('claim_no', $audit)->orderBy('created_at', 'desc')->get()->toArray();

			$claim_array = array_filter(array_map('array_filter', $claim_data));

	        $multi_claim_data = $claim_array;

	        $merge_claim_data = array_reduce($multi_claim_data, 'array_merge', array());

	        $wo = array_column($merge_claim_data, 'claim_no');

	        $claim_data = in_array($claim_no, $wo);
        }

    	return response()->json([
				'claim_count' => $claim_data,
				'claim_no' => $claim_no,
		    	'data' => 'success'
		    ]);
    }

    public function get_rcm_claimno(LoginRequest $request){
    	$claim_no = $request->get('claim_no');
		$user_id = $request->get('user_id');
		$claim_type = $request->get('claim_type');
		$type = $request->get('type');

		$user_role=User::where('id', $user_id)->pluck('role_id');

		if($user_role[0] == 5 || $user_role[0] == 3 || $user_role[0] == 2)
  		{
  			$users=User::where('role_id', '7')->orWhere('role_id', '3')->pluck('id');

   			$claims = Claim_history::where('claim_state','8')->distinct('claim_id')->pluck('claim_id');

   			$claim_data[] = Import_field::whereIN('claim_no',$claims)->where('claim_Status','RCM Team')->distinct('claim_no')->get()->toArray();

   			$claim_array = array_filter(array_map('array_filter', $claim_data));

	        $multi_claim_data = $claim_array;

	        $merge_claim_data = array_reduce($multi_claim_data, 'array_merge', array());

	        $rcm = array_column($merge_claim_data, 'claim_no');

	        $claim_data = in_array($claim_no, $rcm);
  		}

  		return response()->json([
				'claim_count' => $claim_data,
		    	'data' => 'success'
		    ]);
    }

    public function get_client_claimno(LoginRequest $request){
		$claim_no = $request->get('claim_no');
		$user_id = $request->get('user_id');
		$claim_type = $request->get('claim_type');

		$user_role=User::where('id', $user_id)->first();

		if($user_role['role_id'] == 5 || $user_role['role_id'] == 3 || $user_role['role_id'] == 2)
        {

        	$users=User::where('role_id', '6')->orWhere('role_id', '3')->pluck('id');
            $claims = Claim_history::where('claim_state','7')->distinct('claim_id')->pluck('claim_id');
            $claim_count= Action::whereIN('assigned_to', $users)->distinct('claim_id')->pluck('claim_id');

            $claim_data[] = Import_field::whereIN('claim_no',$claims)->where('claim_Status','Client Assistance')->distinct('claim_no')->get()->toArray();

            $claim_array = array_filter(array_map('array_filter', $claim_data));

	        $multi_claim_data = $claim_array;

	        $merge_claim_data = array_reduce($multi_claim_data, 'array_merge', array());

	        $client = array_column($merge_claim_data, 'claim_no');

	        $claim_data = in_array($claim_no, $client);
        }
        return response()->json([
				'claim_count' => $claim_data,
		    	'data' => 'success'
		    ]);
    }

	public function getSummaryDetails(){
		$summary['total_assigned'] = 0;
		$summary['total_worked'] = 0;
		$summary['total_pending'] = 0;
		return response()->json([
				'summary' => $summary,
		    	'data' => 'success'
		    ]);
	}

	public function getAlertNotification(LoginRequest $request){

		$user_id = $request->get('user_id');

		$user_role=User::where('id', $user_id)->first();

		if($user_role['role_id'] == 5 || $user_role['role_id'] == 3 || $user_role['role_id'] == 2)
        {

        	$users=User::where('role_id', '6')->orWhere('role_id', '3')->pluck('id');
            $claims = Claim_history::where('claim_state','7')->distinct('claim_id')->pluck('claim_id');
            $claim_count= Action::whereIN('assigned_to', $users)->distinct('claim_id')->pluck('claim_id');
            $claim_count=sizeof($claim_count);

			$claim_count = Import_field::whereIN('claim_no',$claims)->where('claim_Status','Client Assistance')->count();

        }else if($user_role['role_id'] == 4 || $user_role['role_id'] == 1)
        {

        	$users = User::where('role_id', '4')->orWhere('role_id', '1')->pluck('id');

            $claims = Claim_history::where('claim_state','7')->where('assigned_to', $user_id)->distinct('claim_id')->pluck('claim_id');

            $claim_count= Action::whereIN('assigned_to', $users)->distinct('claim_id')->pluck('claim_id');

            $claim_count=sizeof($claim_count);

            $claim_count= Import_field::whereIN('claim_no',$claims)->where('claim_Status','Client Assistance')->count();

        }


        $pending_claim_count = Import_field::whereNull('followup_work_order')->count();

        $claim_data = Import_field::whereNotNull('followup_work_order')->get()->toArray();


        $claim_note = Claim_note::where('created_by', $user_id)->groupBy('claim_id')->get()->toArray();

        foreach($claim_note as $key => $active)
        {

            $query = DB::table('claim_notes')
                ->select(DB::raw("COUNT(claim_id) count, claim_id, id"))
                ->where('claim_id' , $active['claim_id'])
                ->where('created_by' , $user_id)
                ->havingRaw("COUNT(claim_id) > 3")
                ->get()->toArray();

            $count[$key] = (isset($query[0]))?$query[0]->claim_id:0;

        }

        $countArray = array_filter($count);

        //dd($countArray);

        $claim_data = Import_field::whereIn('claim_no',  $countArray)->get();

        $claim_count = $claim_data->count();

        //dd($claim_data);

        // foreach($claim_data as $key=>$value)
        // {

        // 	$claim_data[$key]['touch'] = Claim_note::where('claim_id', @$claim_data[$key]['claim_no'])->count();

        // 	if($claim_data[$key]['touch'] == 4){

        // 		$op_data['datas'] = $claim_data;

        // 	}

        // 	// print_r($claim_data[$key]['touch']); echo "</br>";
        // }

		//  dd($op_data);



		return response()->json([
		    	'data' => 'success',
		    	'client_assistance_count' => $claim_count,
		    	'pending_claim_count' => $pending_claim_count,
		    	'touch_count' => $claim_count
		    ]);
	}

	public function get_users_lists(LoginRequest $request)
    {

        $roles_active = Role::where('status', 'Inactive')->pluck('id');


        $profile = Profile::all();
        $work_profile = User_work_profile::where('status','Active')->get();

        $work_profile_id = User_work_profile::where('status','Active')->pluck('role_id')->toArray();

        //dd($work_profile_id);
        $i=0;
        foreach($profile as $prof)
        {

            $date_format[0]=(int)date('d', strtotime( $prof['dob']));
            $date_format[1]=(int)date('m', strtotime( $prof['dob']));
            $date_format[2]=(int)date('Y', strtotime( $prof['dob']));

        //    $date= date('m-d-Y',strtotime($prof['dob']));

            $profile[$i]['dob']=$date_format;
            $i++;
        }


        $user = User::whereIN('role_id', $work_profile_id)->get();

        $address = Address_flag::all();

        return response()->json([
            'data'          => $user,
            'profile'       => $profile,
            'address'       => $address,
            'work_profile'  => $work_profile
        ]);
    }
}
