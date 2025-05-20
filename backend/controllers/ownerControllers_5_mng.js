import sqldb from '../config/sqldb.js';

//----------------------------------------------------------------------
// Colors Management Controller
//----------------------------------------------------------------------
// Get all colors
export const getAllColors = (req, res) => {
  const query = 'SELECT * FROM colors ORDER BY ColorValue';
  
  sqldb.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching colors:', err);
      return res.status(500).json({ message: 'Error fetching colors' });
    }
    
    res.status(200).json(results);
  });
};

// Add a new color
export const addColor = (req, res) => {
  const { colorValue } = req.body;
  
  if (!colorValue || colorValue.trim() === '') {
    return res.status(400).json({ message: 'Color value is required' });
  }
  
  // Check if color already exists
  const checkQuery = 'SELECT * FROM colors WHERE ColorValue = ?';
  sqldb.query(checkQuery, [colorValue], (err, results) => {
    if (err) {
      console.error('Error checking color:', err);
      return res.status(500).json({ message: 'Error checking color' });
    }
    
    if (results.length > 0) {
      return res.status(409).json({ message: 'This color already exists' });
    }
    
    // Insert new color
    const insertQuery = 'INSERT INTO colors (ColorValue) VALUES (?)';
    sqldb.query(insertQuery, [colorValue], (err, result) => {
      if (err) {
        console.error('Error adding color:', err);
        return res.status(500).json({ message: 'Error adding color' });
      }
      
      res.status(201).json({ 
        message: 'Color added successfully',
        color: { ColorID: result.insertId, ColorValue: colorValue }
      });
    });
  });
};

// Update a color
export const updateColor = (req, res) => {
  const { colorId } = req.params;
  const { colorValue } = req.body;
  
  if (!colorValue || colorValue.trim() === '') {
    return res.status(400).json({ message: 'Color value is required' });
  }
  
  // Check if the new color value already exists (excluding current color)
  const checkQuery = 'SELECT * FROM colors WHERE ColorValue = ? AND ColorID != ?';
  sqldb.query(checkQuery, [colorValue, colorId], (err, results) => {
    if (err) {
      console.error('Error checking color:', err);
      return res.status(500).json({ message: 'Error checking color' });
    }
    
    if (results.length > 0) {
      return res.status(409).json({ message: 'This color already exists' });
    }
    
    // Update color
    const updateQuery = 'UPDATE colors SET ColorValue = ? WHERE ColorID = ?';
    sqldb.query(updateQuery, [colorValue, colorId], (err, result) => {
      if (err) {
        console.error('Error updating color:', err);
        return res.status(500).json({ message: 'Error updating color' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Color not found' });
      }
      
      res.status(200).json({ 
        message: 'Color updated successfully',
        color: { ColorID: parseInt(colorId), ColorValue: colorValue }
      });
    });
  });
};

// Delete a color
export const deleteColor = (req, res) => {
  const { colorId } = req.params;
  
  // Check if color is being used in product variations
  const checkUsageQuery = 'SELECT COUNT(*) as count FROM product_variations WHERE ColorID = ?';
  sqldb.query(checkUsageQuery, [colorId], (err, results) => {
    if (err) {
      console.error('Error checking color usage:', err);
      return res.status(500).json({ message: 'Error checking color usage' });
    }
    
    if (results[0].count > 0) {
      return res.status(409).json({ 
        message: 'This color cannot be deleted because it is being used in products',
        inUse: true
      });
    }
    
    // Delete color
    const deleteQuery = 'DELETE FROM colors WHERE ColorID = ?';
    sqldb.query(deleteQuery, [colorId], (err, result) => {
      if (err) {
        console.error('Error deleting color:', err);
        return res.status(500).json({ message: 'Error deleting color' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Color not found' });
      }
      
      res.status(200).json({ message: 'Color deleted successfully' });
    });
  });
};


//----------------------------------------------------------------------
// Sizes Management Controller
//----------------------------------------------------------------------

// Get all sizes
export const getAllSizes = (req, res) => {
  const query = 'SELECT * FROM sizes ORDER BY SizeValue';
  
  sqldb.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching sizes:', err);
      return res.status(500).json({ message: 'Error fetching sizes' });
    }
    
    res.status(200).json(results);
  });
};

// Add a new size
export const addSize = (req, res) => {
  const { sizeValue } = req.body;
  
  if (!sizeValue || sizeValue.trim() === '') {
    return res.status(400).json({ message: 'Size value is required' });
  }
  
  // Check if size already exists
  const checkQuery = 'SELECT * FROM sizes WHERE SizeValue = ?';
  sqldb.query(checkQuery, [sizeValue], (err, results) => {
    if (err) {
      console.error('Error checking size:', err);
      return res.status(500).json({ message: 'Error checking size' });
    }
    
    if (results.length > 0) {
      return res.status(409).json({ message: 'This size already exists' });
    }
    
    // Insert new size
    const insertQuery = 'INSERT INTO sizes (SizeValue) VALUES (?)';
    sqldb.query(insertQuery, [sizeValue], (err, result) => {
      if (err) {
        console.error('Error adding size:', err);
        return res.status(500).json({ message: 'Error adding size' });
      }
      
      res.status(201).json({ 
        message: 'Size added successfully',
        size: { SizeID: result.insertId, SizeValue: sizeValue }
      });
    });
  });
};

// Update a size
export const updateSize = (req, res) => {
  const { sizeId } = req.params;
  const { sizeValue } = req.body;
  
  if (!sizeValue || sizeValue.trim() === '') {
    return res.status(400).json({ message: 'Size value is required' });
  }
  
  // Check if the new size value already exists (excluding current size)
  const checkQuery = 'SELECT * FROM sizes WHERE SizeValue = ? AND SizeID != ?';
  sqldb.query(checkQuery, [sizeValue, sizeId], (err, results) => {
    if (err) {
      console.error('Error checking size:', err);
      return res.status(500).json({ message: 'Error checking size' });
    }
    
    if (results.length > 0) {
      return res.status(409).json({ message: 'This size already exists' });
    }
    
    // Update size
    const updateQuery = 'UPDATE sizes SET SizeValue = ? WHERE SizeID = ?';
    sqldb.query(updateQuery, [sizeValue, sizeId], (err, result) => {
      if (err) {
        console.error('Error updating size:', err);
        return res.status(500).json({ message: 'Error updating size' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Size not found' });
      }
      
      res.status(200).json({ 
        message: 'Size updated successfully',
        size: { SizeID: parseInt(sizeId), SizeValue: sizeValue }
      });
    });
  });
};

// Delete a size
export const deleteSize = (req, res) => {
  const { sizeId } = req.params;
  
  // Check if size is being used in product variations
  const checkUsageQuery = 'SELECT COUNT(*) as count FROM product_variations WHERE SizeID = ?';
  sqldb.query(checkUsageQuery, [sizeId], (err, results) => {
    if (err) {
      console.error('Error checking size usage:', err);
      return res.status(500).json({ message: 'Error checking size usage' });
    }
    
    if (results[0].count > 0) {
      return res.status(409).json({ 
        message: 'This size cannot be deleted because it is being used in products',
        inUse: true
      });
    }
    
    // Delete size
    const deleteQuery = 'DELETE FROM sizes WHERE SizeID = ?';
    sqldb.query(deleteQuery, [sizeId], (err, result) => {
      if (err) {
        console.error('Error deleting size:', err);
        return res.status(500).json({ message: 'Error deleting size' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Size not found' });
      }
      
      res.status(200).json({ message: 'Size deleted successfully' });
    });
  });
};


//----------------------------------------------------------------------
// Delivery Options Management Controller
//----------------------------------------------------------------------

// Get all delivery options
export const getAllDeliveryOptions = (req, res) => {
  const query = 'SELECT * FROM delivery_options ORDER BY cost';
  
  sqldb.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching delivery options:', err);
      return res.status(500).json({ message: 'Error fetching delivery options' });
    }
    
    res.status(200).json(results);
  });
};

// Add a new delivery option
export const addDeliveryOption = (req, res) => {
  const { name, description, cost, estimatedDays, isActive = true } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Delivery option name is required' });
  }
  
  if (cost === undefined || cost === null || isNaN(parseFloat(cost))) {
    return res.status(400).json({ message: 'Valid delivery cost is required' });
  }
  
  if (estimatedDays === undefined || estimatedDays === null || isNaN(parseInt(estimatedDays))) {
    return res.status(400).json({ message: 'Valid estimated days is required' });
  }
  
  // Check if delivery option already exists
  const checkQuery = 'SELECT * FROM delivery_options WHERE name = ?';
  sqldb.query(checkQuery, [name], (err, results) => {
    if (err) {
      console.error('Error checking delivery option:', err);
      return res.status(500).json({ message: 'Error checking delivery option' });
    }
    
    if (results.length > 0) {
      return res.status(409).json({ message: 'This delivery option already exists' });
    }
    
    // Insert new delivery option
    const insertQuery = 'INSERT INTO delivery_options (name, description, cost, estimated_days, is_active) VALUES (?, ?, ?, ?, ?)';
    sqldb.query(insertQuery, [name, description || '', parseFloat(cost), parseInt(estimatedDays), isActive], (err, result) => {
      if (err) {
        console.error('Error adding delivery option:', err);
        return res.status(500).json({ message: 'Error adding delivery option' });
      }
      
      res.status(201).json({ 
        message: 'Delivery option added successfully',
        deliveryOption: { 
          delivery_id: result.insertId, 
          name, 
          description: description || '',
          cost: parseFloat(cost),
          estimated_days: parseInt(estimatedDays),
          is_active: isActive
        }
      });
    });
  });
};

// Update a delivery option
export const updateDeliveryOption = (req, res) => {
  const { deliveryId } = req.params;
  const { name, description, cost, estimatedDays, isActive } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Delivery option name is required' });
  }
  
  if (cost === undefined || cost === null || isNaN(parseFloat(cost))) {
    return res.status(400).json({ message: 'Valid delivery cost is required' });
  }
  
  if (estimatedDays === undefined || estimatedDays === null || isNaN(parseInt(estimatedDays))) {
    return res.status(400).json({ message: 'Valid estimated days is required' });
  }
  
  // Check if the new delivery option name already exists (excluding current option)
  const checkQuery = 'SELECT * FROM delivery_options WHERE name = ? AND delivery_id != ?';
  sqldb.query(checkQuery, [name, deliveryId], (err, results) => {
    if (err) {
      console.error('Error checking delivery option:', err);
      return res.status(500).json({ message: 'Error checking delivery option' });
    }
    
    if (results.length > 0) {
      return res.status(409).json({ message: 'This delivery option name already exists' });
    }
    
    // Update delivery option
    const updateQuery = 'UPDATE delivery_options SET name = ?, description = ?, cost = ?, estimated_days = ?, is_active = ? WHERE delivery_id = ?';
    sqldb.query(updateQuery, [name, description || '', parseFloat(cost), parseInt(estimatedDays), isActive, deliveryId], (err, result) => {
      if (err) {
        console.error('Error updating delivery option:', err);
        return res.status(500).json({ message: 'Error updating delivery option' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Delivery option not found' });
      }
      
      res.status(200).json({ 
        message: 'Delivery option updated successfully',
        deliveryOption: { 
          delivery_id: parseInt(deliveryId), 
          name, 
          description: description || '',
          cost: parseFloat(cost),
          estimated_days: parseInt(estimatedDays),
          is_active: isActive
        }
      });
    });
  });
};

// Delete a delivery option
export const deleteDeliveryOption = (req, res) => {
  const { deliveryId } = req.params;
  
  // Check if delivery option is being used in orders
  const checkUsageQuery = 'SELECT COUNT(*) as count FROM orders WHERE delivery_option_id = ?';
  sqldb.query(checkUsageQuery, [deliveryId], (err, results) => {
    if (err) {
      console.error('Error checking delivery option usage:', err);
      return res.status(500).json({ message: 'Error checking delivery option usage' });
    }
    
    if (results[0].count > 0) {
      return res.status(409).json({ 
        message: 'This delivery option cannot be deleted because it is being used in orders',
        inUse: true
      });
    }
    
    // Delete delivery option
    const deleteQuery = 'DELETE FROM delivery_options WHERE delivery_id = ?';
    sqldb.query(deleteQuery, [deliveryId], (err, result) => {
      if (err) {
        console.error('Error deleting delivery option:', err);
        return res.status(500).json({ message: 'Error deleting delivery option' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Delivery option not found' });
      }
      
      res.status(200).json({ message: 'Delivery option deleted successfully' });
    });
  });
};

// Toggle delivery option status
export const toggleDeliveryOptionStatus = (req, res) => {
  const { deliveryId } = req.params;
  const { isActive } = req.body;
  
  if (isActive === undefined) {
    return res.status(400).json({ message: 'Status value is required' });
  }
  
  const updateQuery = 'UPDATE delivery_options SET is_active = ? WHERE delivery_id = ?';
  sqldb.query(updateQuery, [isActive, deliveryId], (err, result) => {
    if (err) {
      console.error('Error updating delivery option status:', err);
      return res.status(500).json({ message: 'Error updating delivery option status' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Delivery option not found' });
    }
    
    res.status(200).json({ 
      message: `Delivery option ${isActive ? 'enabled' : 'disabled'} successfully`,
      isActive: isActive
    });
  });
};
