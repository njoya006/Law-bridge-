REVIEWER_ROLES = {'partner', 'firm_admin', 'owner', 'admin'}
LAWYER_ROLES = {'lawyer', 'associate', 'partner', 'firm_admin', 'owner', 'secretary'}


def get_caller(request):
    """Return (user_id_str, role, firm_id_str_or_None) from the JWT-authenticated user."""
    user = request.user
    user_id = str(getattr(user, 'id', '') or '')
    role = getattr(user, 'role', '') or ''
    # firm_id is not in JWT — accept from X-Firm-ID header or ?firm_id query param
    firm_id = (
        request.META.get('HTTP_X_FIRM_ID')
        or request.query_params.get('firm_id')
        or None
    )
    return user_id, role, firm_id


def can_create_book(role):
    return role in LAWYER_ROLES or role == 'admin'


def can_view_book(book, caller_id, caller_role, caller_firm_id):
    if book.status == book.STATUS_PUBLISHED:
        if book.tier == book.TIER_GENERAL:
            return True
        # firm tier: caller must belong to the same firm
        return caller_firm_id and str(book.firm_id) == str(caller_firm_id)
    # Non-published: only author or admin can see
    return str(book.author_id) == caller_id or caller_role == 'admin'


def can_edit_book(book, caller_id, caller_role):
    if book.status not in (book.STATUS_DRAFT, book.STATUS_REJECTED):
        return False
    return str(book.author_id) == caller_id or caller_role == 'admin'


def can_submit_book(book, caller_id):
    return book.status == book.STATUS_DRAFT and str(book.author_id) == caller_id


def can_review_book(book, caller_role, caller_firm_id):
    """Returns True if caller may approve or reject this book."""
    if caller_role == 'admin':
        return True
    if book.tier == book.TIER_FIRM and caller_role in REVIEWER_ROLES:
        return caller_firm_id and str(book.firm_id) == str(caller_firm_id)
    return False
