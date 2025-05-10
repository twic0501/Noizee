import React from 'react';
import ListGroup from 'react-bootstrap/ListGroup';
import { formatDateTime } from '../../utils/formatters';

function OrderHistoryList({ history = [] }) {
    if (!history || history.length === 0) {
        return <p>No history available.</p>;
    }
    return (
        <ListGroup variant="flush">
            {history.map(hist => (
                <ListGroup.Item key={hist.history_id} className="px-0">
                    <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">Status: {hist.history_status}</h6>
                        <small>{formatDateTime(hist.history_date)}</small>
                    </div>
                    {hist.history_notes && (
                        <p className="mb-1 fst-italic"><small>Notes: {hist.history_notes}</small></p>
                    )}
                </ListGroup.Item>
            ))}
        </ListGroup>
    );
}

export default OrderHistoryList;