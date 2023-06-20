<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('claim_infos', function (Blueprint $table) {
            $table->foreign('primary_ins_id', 'fk_insurance_claim')->references('id')->on('insurances')->onUpdate('RESTRICT')->onDelete('RESTRICT');
			$table->foreign('secondary_ins_id', 'fk_insurance_claim_sec')->references('id')->on('insurances')->onUpdate('RESTRICT')->onDelete('RESTRICT');
			$table->foreign('tertiary_ins_id', 'fk_insurance_claim_ter')->references('id')->on('insurances')->onUpdate('RESTRICT')->onDelete('RESTRICT');
			$table->foreign('patient_id', 'fk_patient_claim')->references('id')->on('patient_details')->onUpdate('RESTRICT')->onDelete('RESTRICT');
			$table->foreign('claim_status', 'fk_status_claim')->references('id')->on('sub_status')->onUpdate('RESTRICT')->onDelete('RESTRICT');
			$table->foreign('claim_sub_status', 'fk_status_claim_sub_sts')->references('id')->on('sub_status')->onUpdate('RESTRICT')->onDelete('RESTRICT');
			$table->foreign('created_by', 'fk_user_claim_created')->references('id')->on('users')->onUpdate('RESTRICT')->onDelete('RESTRICT');
			$table->foreign('updated_by', 'fk_user_claim_updated')->references('id')->on('users')->onUpdate('RESTRICT')->onDelete('RESTRICT');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('claim_infos', function (Blueprint $table) {
            $table->dropForeign('fk_insurance_claim');
			$table->dropForeign('fk_insurance_claim_sec');
			$table->dropForeign('fk_insurance_claim_ter');
			$table->dropForeign('fk_patient_claim');
			$table->dropForeign('fk_status_claim');
			$table->dropForeign('fk_status_claim_sub_sts');
			$table->dropForeign('fk_user_claim_created');
			$table->dropForeign('fk_user_claim_updated');
        });
    }
};
