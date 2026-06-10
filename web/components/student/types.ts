export type ActiveSession = {
    id: number;
    code: string;
    course_id: number;
    course_code?: string;
    course_name?: string;
    programme?: string | null;
    starts_at?: string;
    ends_at?: string;
    /** Seconds left in the session, computed by the server at fetch time. */
    time_remaining_seconds?: number | null;
    /** Client-clock end time (ms epoch), anchored when the list was fetched. */
    ends_at_ms?: number;
    already_marked?: boolean;
    attendance_status?: string;
};


