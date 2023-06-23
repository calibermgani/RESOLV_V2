<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;

class ImportNewClaims implements ToCollection
{
    public $filename;
    public $report_date;
    public $notes;
    public $user;
    public $unique_name;
    public $practice_dbid;

    public function __construct($filename, $report_date, $notes, $user, $unique_name, $practice_dbid)
    {
        $this->filename = $filename;
        $this->report_date = $report_date;
        $this->notes = $notes;
        $this->user = $user;
        $this->unique_name = $unique_name;
        $this->practice_dbid = $practice_dbid;

    }

    public function startRow(): int
    {
        return 2;
    }

    /**
    * @param Collection $collection
    */
    public function collection(Collection $collections)
    {
        foreach($collections as $collection)
        {
            Log::debug('collection excel Testing' . print_r($collection, true));
            return $collection;
        }
    }
}
