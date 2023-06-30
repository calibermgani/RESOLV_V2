<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class File_upload extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'id', 'report_date', 'file_name', 'unique_name', 'file_url', 'notes', 'total_claims', 'new_claims', 'Import_by', 'claims_processed', 'status'
    ];
}
